import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Linking,
  PixelRatio,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImageManipulator from 'expo-image-manipulator'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { captureScreen } from 'react-native-view-shot'
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview'
import {
  getValidHttpUrl,
  isAppEventWebOrigin,
  isTrustedAppEventUrl,
} from '../../src/features/app-event/lib/targetNavigation'
import { refreshAuthTokens } from '../../src/lib/auth/refresh-token'
import { useAuthStore } from '../../src/store/auth.store'
import { C, Magenta, Radius, Typography } from '../../src/theme'

type StoryCardCaptureRect = {
  x: number
  y: number
  width: number
  height: number
}
type StoryCardImagePayload =
  | { requestId: string; uri: string }
  | { requestId: string; rect: StoryCardCaptureRect }
type StoryCardSharePayload = StoryCardImagePayload & {
  message: string
  target: 'default' | 'twitter'
}

type StorixWebViewMessage =
  | { type: 'WEBVIEW_READY' }
  | {
      type: 'ATTENDANCE_COMPLETED'
      payload: {
        totalAttendedDays: number
        newlyIssuedTickets: number
        issuedTickets: number
      }
    }
  | { type: 'CLOSE_WEBVIEW' }
  | { type: 'OPEN_EXTERNAL_URL'; payload: { url: string } }
  | { type: 'OPEN_WORKS_DETAIL'; payload: { worksId: number } }
  | { type: 'SAVE_STORY_CARD_IMAGE'; payload: StoryCardImagePayload }
  | {
      type: 'SHARE_STORY_CARD_IMAGE'
      payload: StoryCardSharePayload
    }
  | {
      type: 'CONVERT_STORY_CARD_IMAGES'
      payload: {
        requestId: string
        images: Array<{ key: string; url: string }>
      }
    }
  | { type: 'LOGIN_REQUIRED' }
  | { type: 'EVENT_ERROR'; payload: { code?: string; message: string } }

type NativeShareModule = typeof import('react-native-share')

const STORIX_SHARE_URL = 'https://www.storix.kr/'
const TWITTER_ANDROID_PACKAGE = 'com.twitter.android'

function createAuthInjectionScript(accessToken: string | null): string {
  const serializedToken = JSON.stringify(accessToken)
  return `
    (function () {
      var detail = { accessToken: ${serializedToken} };
      window.__STORIX_AUTH__ = detail;
      window.dispatchEvent(new CustomEvent('STORIX_AUTH', { detail: detail }));
    })();
    true;
  `
}

function parseWebViewMessage(raw: string): StorixWebViewMessage | null {
  try {
    const message = JSON.parse(raw) as { type?: unknown; payload?: unknown }
    if (!message || typeof message !== 'object' || typeof message.type !== 'string') {
      return null
    }

    switch (message.type) {
      case 'WEBVIEW_READY':
      case 'CLOSE_WEBVIEW':
      case 'LOGIN_REQUIRED':
        return { type: message.type }
      case 'ATTENDANCE_COMPLETED': {
        const payload = message.payload as Record<string, unknown> | null
        if (
          !payload ||
          typeof payload.totalAttendedDays !== 'number' ||
          typeof payload.newlyIssuedTickets !== 'number' ||
          typeof payload.issuedTickets !== 'number'
        ) {
          return null
        }
        return {
          type: message.type,
          payload: {
            totalAttendedDays: payload.totalAttendedDays,
            newlyIssuedTickets: payload.newlyIssuedTickets,
            issuedTickets: payload.issuedTickets,
          },
        }
      }
      case 'OPEN_EXTERNAL_URL': {
        const payload = message.payload as { url?: unknown } | null
        const url = getValidHttpUrl(payload?.url)
        return url ? { type: message.type, payload: { url } } : null
      }
      case 'OPEN_WORKS_DETAIL': {
        const payload = message.payload as { worksId?: unknown } | null
        const worksId = Number(payload?.worksId)
        return Number.isSafeInteger(worksId) && worksId > 0
          ? { type: message.type, payload: { worksId } }
          : null
      }
      case 'SAVE_STORY_CARD_IMAGE': {
        const payload = message.payload as {
          requestId?: unknown
          uri?: unknown
          rect?: unknown
        } | null
        const uri =
          typeof payload?.uri === 'string' &&
          (payload.uri.startsWith('data:image/') || getValidHttpUrl(payload.uri))
            ? payload.uri
            : null
        const rect = parseStoryCardCaptureRect(payload?.rect)
        if (typeof payload?.requestId !== 'string') return null
        if (uri) return { type: message.type, payload: { requestId: payload.requestId, uri } }
        if (rect) return { type: message.type, payload: { requestId: payload.requestId, rect } }
        return null
      }
      case 'SHARE_STORY_CARD_IMAGE': {
        const payload = message.payload as {
          requestId?: unknown
          uri?: unknown
          rect?: unknown
          message?: unknown
          target?: unknown
        } | null
        const uri =
          typeof payload?.uri === 'string' &&
          (payload.uri.startsWith('data:image/') || getValidHttpUrl(payload.uri))
            ? payload.uri
            : null
        const rect = parseStoryCardCaptureRect(payload?.rect)
        const shareMessage =
          typeof payload?.message === 'string' && payload.message.trim()
            ? payload.message.trim()
            : 'STORIX 오늘의 스토리 카드'
        const target = payload?.target === 'twitter' ? 'twitter' : 'default'

        if (typeof payload?.requestId !== 'string') return null
        if (uri) {
          return {
            type: message.type,
            payload: { requestId: payload.requestId, uri, message: shareMessage, target },
          }
        }
        if (rect) {
          return {
            type: message.type,
            payload: { requestId: payload.requestId, rect, message: shareMessage, target },
          }
        }
        return null
      }
      case 'CONVERT_STORY_CARD_IMAGES': {
        const payload = message.payload as {
          requestId?: unknown
          images?: unknown
        } | null
        if (typeof payload?.requestId !== 'string' || !Array.isArray(payload.images)) {
          return null
        }

        const images = payload.images.flatMap((item) => {
          if (!item || typeof item !== 'object') return []
          const candidate = item as { key?: unknown; url?: unknown }
          const url = typeof candidate.url === 'string' ? getValidHttpUrl(candidate.url) : null
          return typeof candidate.key === 'string' && url
            ? [{ key: candidate.key, url }]
            : []
        })

        return {
          type: message.type,
          payload: { requestId: payload.requestId, images },
        }
      }
      case 'EVENT_ERROR': {
        const payload = message.payload as { code?: unknown; message?: unknown } | null
        if (!payload || typeof payload.message !== 'string') return null
        return {
          type: message.type,
          payload: {
            ...(typeof payload.code === 'string' ? { code: payload.code } : {}),
            message: payload.message,
          },
        }
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

function getSingleParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null
}

function parseStoryCardCaptureRect(value: unknown): StoryCardCaptureRect | null {
  if (!value || typeof value !== 'object') return null
  const rect = value as Record<string, unknown>
  const x = Number(rect.x)
  const y = Number(rect.y)
  const width = Number(rect.width)
  const height = Number(rect.height)

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }

  return { x, y, width, height }
}

function getImageExtension(uri: string): string {
  const withoutQuery = uri.split('?')[0] ?? uri
  const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/)
  const extension = match?.[1]?.toLowerCase()
  return extension === 'jpg' || extension === 'jpeg' || extension === 'webp'
    ? extension
    : 'png'
}

async function getLocalImageUri(uri: string): Promise<string> {
  if (uri.startsWith('file://')) return uri

  const filename = `storix-story-card-${Date.now()}.${getImageExtension(uri)}`
  const destination = `${FileSystem.cacheDirectory}${filename}`

  if (uri.startsWith('data:image/')) {
    const base64 = uri.split(',')[1]
    if (!base64) throw new Error('Invalid data image URI')
    await FileSystem.writeAsStringAsync(destination, base64, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return destination
  }

  const downloaded = await FileSystem.downloadAsync(uri, destination)
  return downloaded.uri
}

async function downloadImageAsDataUrl(url: string): Promise<string> {
  const localUri = await getLocalImageUri(url)
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const extension = getImageExtension(url)
  const mimeType = extension === 'jpg' || extension === 'jpeg'
    ? 'image/jpeg'
    : extension === 'webp'
      ? 'image/webp'
      : 'image/png'

  return `data:${mimeType};base64,${base64}`
}

function getCapturedImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject)
  })
}

function measureViewInWindow(ref: RefObject<View | null>): Promise<{
  x: number
  y: number
  width: number
  height: number
}> {
  return new Promise((resolve, reject) => {
    if (!ref.current) {
      reject(new Error('WebView container is unavailable'))
      return
    }

    ref.current.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        resolve({ x, y, width, height })
      } else {
        reject(new Error('Invalid measured WebView bounds'))
      }
    })
  })
}

function loadNativeShare(): NativeShareModule | null {
  try {
    return require('react-native-share') as NativeShareModule
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[app-event-webview] react-native-share unavailable', {
        message: error instanceof Error ? error.message : undefined,
      })
    }
    return null
  }
}

function normalizeShareUri(uri: string) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(uri)) return uri
  return `file://${uri}`
}

function getShareMessage(message: string) {
  return `${message} ${STORIX_SHARE_URL}`
}

function getOsShareOptions(uri: string, message: string) {
  const fileUri = normalizeShareUri(uri)
  const shareMessage = getShareMessage(message)

  if (Platform.OS === 'ios') {
    return {
      subject: message,
      activityItemSources: [
        {
          placeholderItem: { type: 'text' as const, content: shareMessage },
          item: {
            default: { type: 'text' as const, content: shareMessage },
          },
          subject: {
            default: message,
          },
        },
        {
          placeholderItem: { type: 'url' as const, content: fileUri },
          item: {
            default: { type: 'url' as const, content: fileUri },
          },
          dataTypeIdentifier: {
            default: 'public.png',
          },
        },
      ],
    }
  }

  return {
    message: shareMessage,
    url: fileUri,
    type: 'image/png',
    subject: message,
    filename: 'storix-story-card',
    useInternalStorage: true,
  }
}

async function isTwitterAppInstalled() {
  if (Platform.OS === 'ios') {
    try {
      return Linking.canOpenURL('twitter://')
    } catch {
      return false
    }
  }

  try {
    const nativeShare = loadNativeShare()
    if (!nativeShare) return false

    const result = await nativeShare.default.isPackageInstalled(TWITTER_ANDROID_PACKAGE)
    return result.isInstalled
  } catch {
    return false
  }
}

export default function SharedWebViewScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const params = useLocalSearchParams<{
    url?: string | string[]
  }>()
  const candidateUrl = getValidHttpUrl(getSingleParam(params.url))
  const url = isTrustedAppEventUrl(candidateUrl) ? candidateUrl : null
  const webViewSource = useMemo(
    () =>
      url
        ? {
            uri: url,
            headers: {
              'x-vercel-skip-toolbar': '1',
            },
          }
        : null,
    [url],
  )
  const authInjectionScript = useMemo(
    () => createAuthInjectionScript(accessToken),
    [accessToken],
  )
  const webViewRef = useRef<WebView>(null)
  const webViewContainerRef = useRef<View>(null)
  const canGoBackRef = useRef(false)
  const authRecoveryInFlightRef = useRef(false)
  const authRecoveryAttemptedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(Boolean(url))
  const [hasError, setHasError] = useState(!url)
  const [reloadKey, setReloadKey] = useState(0)

  const closeScreen = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)' as never)
  }, [router])

  const handleBack = useCallback(() => {
    if (canGoBackRef.current) {
      webViewRef.current?.goBack()
      return
    }
    closeScreen()
  }, [closeScreen])

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBack()
        return true
      },
    )
    return () => subscription.remove()
  }, [handleBack])

  useEffect(() => {
    if (!url || !accessToken) return
    webViewRef.current?.injectJavaScript(authInjectionScript)
  }, [accessToken, authInjectionScript, url])

  const handleNavigationStateChange = useCallback(
    (navigationState: WebViewNavigation) => {
      canGoBackRef.current = navigationState.canGoBack
    },
    [],
  )

  const retry = useCallback(() => {
    if (!url) return
    canGoBackRef.current = false
    setHasError(false)
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }, [url])

  const captureStoryCardView = useCallback(
    async (rect: StoryCardCaptureRect): Promise<string> => {
      const [capturedUri, webViewBounds] = await Promise.all([
        captureScreen({ format: 'png', quality: 1 }),
        measureViewInWindow(webViewContainerRef),
      ])
      const imageSize = await getCapturedImageSize(capturedUri)
      const windowSize = Dimensions.get('window')
      if (windowSize.width <= 0 || windowSize.height <= 0) return capturedUri

      // PixelRatio를 고려한 정확한 스케일 계산
      const pixelRatio = PixelRatio.get()
      const scaleX = imageSize.width / windowSize.width
      const scaleY = imageSize.height / windowSize.height

      // 웹뷰 rect는 CSS 픽셀 단위이므로 PixelRatio 적용 필요
      const originX = Math.max(0, Math.floor((webViewBounds.x + rect.x) * scaleX))
      const originY = Math.max(0, Math.floor((webViewBounds.y + rect.y) * scaleY))
      const cropWidth = Math.min(
        imageSize.width - originX,
        Math.ceil(rect.width * scaleX),
      )
      const cropHeight = Math.min(
        imageSize.height - originY,
        Math.ceil(rect.height * scaleY),
      )

      if (__DEV__) {
        console.log('[StoryCard] Capture debug:', {
          pixelRatio,
          windowSize,
          imageSize,
          webViewBounds,
          rect,
          scale: { scaleX, scaleY },
          crop: { originX, originY, cropWidth, cropHeight },
        })
      }

      if (cropWidth <= 0 || cropHeight <= 0) {
        if (__DEV__) {
          console.warn('[StoryCard] Invalid crop dimensions, returning full capture')
        }
        return capturedUri
      }

      const result = await ImageManipulator.manipulateAsync(
        capturedUri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG },
      )

      return result.uri
    },
    [],
  )

  const resolveStoryCardImageUri = useCallback(
    async (payload: StoryCardImagePayload): Promise<string> => {
      if ('uri' in payload) return getLocalImageUri(payload.uri)
      return captureStoryCardView(payload.rect)
    },
    [captureStoryCardView],
  )

  const postNativeResultToWebView = useCallback(
    (message: Record<string, unknown>) => {
      const serialized = JSON.stringify(message)
      webViewRef.current?.injectJavaScript(`
        (function () {
          var message = ${JSON.stringify(serialized)};
          window.dispatchEvent(new MessageEvent('message', { data: message }));
          window.dispatchEvent(new CustomEvent('STORIX_NATIVE_MESSAGE', { detail: message }));
        })();
        true;
      `)
    },
    [],
  )

  const saveStoryCardImage = useCallback(
    async (payload: StoryCardImagePayload) => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync(true)
        if (status !== 'granted') {
          throw new Error('Media library permission denied')
        }

        const localUri = await resolveStoryCardImageUri(payload)
        await MediaLibrary.saveToLibraryAsync(localUri)
        postNativeResultToWebView({
          type: 'SAVE_STORY_CARD_IMAGE_RESULT',
          payload: { requestId: payload.requestId, success: true },
        })
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[app-event-webview] save story card failed', error)
        }
        Alert.alert('저장 실패', '이미지 저장 중 오류가 발생했습니다.')
        postNativeResultToWebView({
          type: 'SAVE_STORY_CARD_IMAGE_RESULT',
          payload: { requestId: payload.requestId, success: false },
        })
      }
    },
    [postNativeResultToWebView, resolveStoryCardImageUri],
  )

  const shareStoryCardImage = useCallback(
    async (payload: StoryCardSharePayload) => {
      try {
        const localUri = await resolveStoryCardImageUri(payload)
        const nativeShare = loadNativeShare()

        if (payload.target === 'twitter') {
          const twitterInstalled = await isTwitterAppInstalled()
          if (twitterInstalled && nativeShare) {
            await nativeShare.default.shareSingle({
              social: nativeShare.Social.Twitter,
              url: normalizeShareUri(localUri),
              type: 'image/png',
              message: getShareMessage(payload.message),
            })
          } else {
            await Sharing.shareAsync(localUri, {
              mimeType: 'image/png',
              dialogTitle: payload.message,
              UTI: 'public.png',
            })
          }
        } else if (nativeShare) {
          await nativeShare.default.open({
            ...getOsShareOptions(localUri, payload.message),
            title: payload.message,
            failOnCancel: false,
          })
        } else {
          const isSharingAvailable = await Sharing.isAvailableAsync()
          if (!isSharingAvailable) {
            throw new Error('Native sharing unavailable')
          }
          await Sharing.shareAsync(localUri, {
            mimeType: 'image/png',
            dialogTitle: payload.message,
            UTI: 'public.png',
          })
        }

        postNativeResultToWebView({
          type: 'SHARE_STORY_CARD_IMAGE_RESULT',
          payload: { requestId: payload.requestId, success: true },
        })
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[app-event-webview] share story card failed', error)
        }
        Alert.alert('공유 실패', '이미지 공유 중 오류가 발생했습니다.')
        postNativeResultToWebView({
          type: 'SHARE_STORY_CARD_IMAGE_RESULT',
          payload: { requestId: payload.requestId, success: false },
        })
      }
    },
    [postNativeResultToWebView, resolveStoryCardImageUri],
  )

  const convertStoryCardImages = useCallback(
    async (payload: {
      requestId: string
      images: Array<{ key: string; url: string }>
    }) => {
      const images: Record<string, string> = {}

      await Promise.all(
        payload.images.map(async (image) => {
          try {
            images[image.key] = await downloadImageAsDataUrl(image.url)
          } catch (error) {
            if (__DEV__) {
              // eslint-disable-next-line no-console
              console.warn('[app-event-webview] convert story card image failed', {
                key: image.key,
                url: image.url,
                error,
              })
            }
          }
        }),
      )

      postNativeResultToWebView({
        type: 'CONVERT_STORY_CARD_IMAGES_RESULT',
        payload: { requestId: payload.requestId, images },
      })
    },
    [postNativeResultToWebView],
  )

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      if (!url) return
      const message = parseWebViewMessage(event.nativeEvent.data)
      if (!message) return

      switch (message.type) {
        case 'WEBVIEW_READY':
          if (accessToken) {
            webViewRef.current?.injectJavaScript(authInjectionScript)
          }
          return
        case 'ATTENDANCE_COMPLETED':
          return
        case 'CLOSE_WEBVIEW':
          closeScreen()
          return
        case 'OPEN_EXTERNAL_URL':
          if (isAppEventWebOrigin(message.payload.url)) {
            return
          }
          await Linking.openURL(message.payload.url).catch(() => undefined)
          return
        case 'OPEN_WORKS_DETAIL':
          router.push(`/works/${message.payload.worksId}` as never)
          return
        case 'SAVE_STORY_CARD_IMAGE':
          await saveStoryCardImage(message.payload)
          return
        case 'SHARE_STORY_CARD_IMAGE':
          await shareStoryCardImage(message.payload)
          return
        case 'CONVERT_STORY_CARD_IMAGES':
          await convertStoryCardImages(message.payload)
          return
        case 'LOGIN_REQUIRED': {
          if (
            authRecoveryInFlightRef.current ||
            authRecoveryAttemptedRef.current
          ) {
            return
          }
          authRecoveryInFlightRef.current = true
          authRecoveryAttemptedRef.current = true
          const refreshed = await refreshAuthTokens()
          authRecoveryInFlightRef.current = false

          if (refreshed.ok) {
            webViewRef.current?.injectJavaScript(
              createAuthInjectionScript(refreshed.accessToken),
            )
          } else {
            await useAuthStore.getState().clearAuth()
          }
          return
        }
        case 'EVENT_ERROR':
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[app-event-webview] event error', message.payload)
          }
          Alert.alert(
            '이벤트 오류',
            message.payload.message || '이벤트 정보를 불러오지 못했어요.',
          )
          return
      }
    },
    [
      accessToken,
      authInjectionScript,
      closeScreen,
      convertStoryCardImages,
      router,
      saveStoryCardImage,
      shareStoryCardImage,
      url,
    ],
  )

  const shouldStartLoad = useCallback(
    (request: { url: string }) => {
      if (request.url === 'about:blank' || getValidHttpUrl(request.url)) {
        return true
      }
      return false
    },
    [],
  )

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {webViewSource && !hasError ? (
        <View
          ref={webViewContainerRef}
          style={styles.content}
          collapsable={false}
        >
          <WebView
            key={reloadKey}
            ref={webViewRef}
            source={webViewSource}
            style={styles.webView}
            androidLayerType="hardware"
            setSupportMultipleWindows={false}
            bounces={false}
            overScrollMode="never"
            injectedJavaScriptBeforeContentLoaded={authInjectionScript}
            injectedJavaScript={authInjectionScript}
            onMessage={(event) => void handleMessage(event)}
            onShouldStartLoadWithRequest={shouldStartLoad}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => {
              setIsLoading(false)
              if (accessToken) {
                webViewRef.current?.injectJavaScript(authInjectionScript)
              }
            }}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
            onHttpError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.centerState}>
          <Text style={styles.messageText}>
            {url ? '페이지를 불러오지 못했어요.' : '유효하지 않은 주소예요.'}
          </Text>
          {url ? (
            <Pressable onPress={retry} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  content: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  messageText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: Radius.sm,
    backgroundColor: Magenta[300],
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: {
    ...Typography.body2Medium,
    color: C.card,
  },
})
