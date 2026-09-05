import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  | { type: 'TOKEN_EXPIRED' }
  | { type: 'EVENT_ERROR'; payload: { code?: string; message: string } }

type NativeShareModule = typeof import('react-native-share')

const STORIX_SHARE_URL = 'https://www.storix.kr/'
const TWITTER_ANDROID_PACKAGE = 'com.twitter.android'
const WEBVIEW_ERROR_SUPPRESSION_AFTER_SHARE_MS = 3000

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
      case 'TOKEN_EXPIRED':
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
  return extension === 'jpg' || extension === 'jpeg' || extension === 'webp' || extension === 'svg'
    ? extension
    : 'png'
}

function getImageExtensionForMimeType(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/svg+xml') return 'svg'
  return 'png'
}

function normalizeImageMimeType(value: string | null | undefined): string | null {
  const mimeType = value?.split(';')[0]?.trim().toLowerCase()
  if (!mimeType?.startsWith('image/')) return null
  if (mimeType === 'image/jpg') return 'image/jpeg'
  return mimeType
}

function inferImageMimeType(uri: string): string {
  const dataMimeType = uri.match(/^data:([^;,]+)/i)?.[1]
  const normalizedDataMimeType = normalizeImageMimeType(dataMimeType)
  if (normalizedDataMimeType) return normalizedDataMimeType

  const extension = getImageExtension(uri)
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'svg') return 'image/svg+xml'
  return 'image/png'
}

function getResponseContentType(headers: Record<string, string>): string | null {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === 'content-type')
  return normalizeImageMimeType(entry?.[1])
}

type LocalImageFile = {
  uri: string
  mimeType: string
}

async function getLocalImageFile(uri: string): Promise<LocalImageFile> {
  if (uri.startsWith('file://')) {
    return { uri, mimeType: inferImageMimeType(uri) }
  }

  const uniqueSuffix =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  if (uri.startsWith('data:image/')) {
    const mimeType = inferImageMimeType(uri)
    const filename = `storix-story-card-${uniqueSuffix}.${getImageExtensionForMimeType(mimeType)}`
    const destination = `${FileSystem.cacheDirectory}${filename}`
    const base64 = uri.split(',')[1]
    if (!base64) throw new Error('Invalid data image URI')
    await FileSystem.writeAsStringAsync(destination, base64, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return { uri: destination, mimeType }
  }

  const temporaryDestination =
    `${FileSystem.cacheDirectory}storix-story-card-${uniqueSuffix}.download`
  const downloaded = await FileSystem.downloadAsync(uri, temporaryDestination)
  if (downloaded.status < 200 || downloaded.status >= 300) {
    throw new Error(`Image download failed with status ${downloaded.status}`)
  }

  const mimeType =
    normalizeImageMimeType(downloaded.mimeType) ??
    getResponseContentType(downloaded.headers) ??
    inferImageMimeType(uri)
  const filename = `storix-story-card-${uniqueSuffix}.${getImageExtensionForMimeType(mimeType)}`
  const destination = `${FileSystem.cacheDirectory}${filename}`
  await FileSystem.moveAsync({ from: downloaded.uri, to: destination })
  return { uri: destination, mimeType }
}

async function downloadImageAsDataUrl(url: string): Promise<{
  dataUrl: string
  mimeType: string
}> {
  const localImage = await getLocalImageFile(url)
  const base64 = await FileSystem.readAsStringAsync(localImage.uri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  return {
    dataUrl: `data:${localImage.mimeType};base64,${base64}`,
    mimeType: localImage.mimeType,
  }
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

function getImageUti(mimeType: string): string {
  if (mimeType === 'image/png') return 'public.png'
  if (mimeType === 'image/jpeg') return 'public.jpeg'
  if (mimeType === 'image/webp') return 'org.webmproject.webp'
  if (mimeType === 'image/svg+xml') return 'public.svg-image'
  return 'public.image'
}

function getOsShareOptions(image: LocalImageFile, message: string) {
  const fileUri = normalizeShareUri(image.uri)
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
            default: getImageUti(image.mimeType),
          },
        },
      ],
    }
  }

  return {
    message: shareMessage,
    url: fileUri,
    type: image.mimeType,
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
  const canGoBackRef = useRef(false)
  const authRecoveryInFlightRef = useRef(false)
  const authRecoveryAttemptedRef = useRef(false)
  const suppressWebViewErrorUntilRef = useRef(0)
  const mediaRequestInFlightRef = useRef(false)
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

  const resolveStoryCardImageFile = useCallback(
    async (payload: StoryCardImagePayload): Promise<LocalImageFile> => {
      if ('rect' in payload) {
        throw new Error('Legacy rect capture is no longer supported')
      }
      return getLocalImageFile(payload.uri)
    },
    [],
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
      if ('rect' in payload) {
        postNativeResultToWebView({
          type: 'SAVE_STORY_CARD_IMAGE_RESULT',
          payload: {
            requestId: payload.requestId,
            success: false,
            code: 'RECT_CAPTURE_UNSUPPORTED',
          },
        })
        return
      }

      if (mediaRequestInFlightRef.current) {
        postNativeResultToWebView({
          type: 'SAVE_STORY_CARD_IMAGE_RESULT',
          payload: {
            requestId: payload.requestId,
            success: false,
            code: 'MEDIA_REQUEST_IN_PROGRESS',
          },
        })
        return
      }

      mediaRequestInFlightRef.current = true
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync(true)
        if (status !== 'granted') {
          throw new Error('Media library permission denied')
        }

        const localImage = await resolveStoryCardImageFile(payload)
        await MediaLibrary.saveToLibraryAsync(localImage.uri)
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
      } finally {
        mediaRequestInFlightRef.current = false
      }
    },
    [postNativeResultToWebView, resolveStoryCardImageFile],
  )

  const shareStoryCardImage = useCallback(
    async (payload: StoryCardSharePayload) => {
      if ('rect' in payload) {
        postNativeResultToWebView({
          type: 'SHARE_STORY_CARD_IMAGE_RESULT',
          payload: {
            requestId: payload.requestId,
            success: false,
            code: 'RECT_CAPTURE_UNSUPPORTED',
          },
        })
        return
      }

      if (mediaRequestInFlightRef.current) {
        postNativeResultToWebView({
          type: 'SHARE_STORY_CARD_IMAGE_RESULT',
          payload: {
            requestId: payload.requestId,
            success: false,
            code: 'MEDIA_REQUEST_IN_PROGRESS',
          },
        })
        return
      }

      mediaRequestInFlightRef.current = true
      suppressWebViewErrorUntilRef.current =
        Date.now() + WEBVIEW_ERROR_SUPPRESSION_AFTER_SHARE_MS

      try {
        const localImage = await resolveStoryCardImageFile(payload)
        const nativeShare = loadNativeShare()

        if (payload.target === 'twitter') {
          const twitterInstalled = await isTwitterAppInstalled()
          if (twitterInstalled && nativeShare) {
            await nativeShare.default.shareSingle({
              social: nativeShare.Social.Twitter,
              url: normalizeShareUri(localImage.uri),
              type: localImage.mimeType,
              message: getShareMessage(payload.message),
            })
          } else {
            await Sharing.shareAsync(localImage.uri, {
              mimeType: localImage.mimeType,
              dialogTitle: payload.message,
              UTI: getImageUti(localImage.mimeType),
            })
          }
        } else if (nativeShare) {
          await nativeShare.default.open({
            ...getOsShareOptions(localImage, payload.message),
            title: payload.message,
            failOnCancel: false,
          })
        } else {
          const isSharingAvailable = await Sharing.isAvailableAsync()
          if (!isSharingAvailable) {
            throw new Error('Native sharing unavailable')
          }
          await Sharing.shareAsync(localImage.uri, {
            mimeType: localImage.mimeType,
            dialogTitle: payload.message,
            UTI: getImageUti(localImage.mimeType),
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
        postNativeResultToWebView({
          type: 'SHARE_STORY_CARD_IMAGE_RESULT',
          payload: { requestId: payload.requestId, success: false },
        })
      } finally {
        mediaRequestInFlightRef.current = false
        suppressWebViewErrorUntilRef.current =
          Date.now() + WEBVIEW_ERROR_SUPPRESSION_AFTER_SHARE_MS
      }
    },
    [postNativeResultToWebView, resolveStoryCardImageFile],
  )

  const convertStoryCardImages = useCallback(
    async (payload: {
      requestId: string
      images: Array<{ key: string; url: string }>
    }) => {
      const images: Record<string, string> = {}
      const mimeTypes: Record<string, string> = {}
      const errors: Array<{ key: string; code: string }> = []

      for (const image of payload.images) {
        try {
          const converted = await downloadImageAsDataUrl(image.url)
          images[image.key] = converted.dataUrl
          mimeTypes[image.key] = converted.mimeType
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('[app-event-webview] converted story card image', {
              requestId: payload.requestId,
              key: image.key,
              mimeType: converted.mimeType,
              dataUrlLength: converted.dataUrl.length,
            })
          }
        } catch (error) {
          errors.push({ key: image.key, code: 'IMAGE_DOWNLOAD_FAILED' })
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[app-event-webview] convert story card image failed', {
              requestId: payload.requestId,
              key: image.key,
              url: image.url,
              error,
            })
          }
        }
      }

      postNativeResultToWebView({
        type: 'CONVERT_STORY_CARD_IMAGES_RESULT',
        payload: {
          requestId: payload.requestId,
          success: errors.length === 0,
          images,
          mimeTypes,
          errors,
        },
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
        case 'TOKEN_EXPIRED': {
          if (authRecoveryInFlightRef.current) {
            return
          }
          authRecoveryInFlightRef.current = true
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

  const shouldSuppressWebViewError = useCallback(() => {
    return Date.now() < suppressWebViewErrorUntilRef.current
  }, [])

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {webViewSource && !hasError ? (
        <View style={styles.content}>
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
            onError={(event) => {
              setIsLoading(false)
              if (shouldSuppressWebViewError()) {
                if (__DEV__) {
                  // eslint-disable-next-line no-console
                  console.warn('[app-event-webview] suppressed transient webview error', event.nativeEvent)
                }
                return
              }
              setHasError(true)
            }}
            onHttpError={(event) => {
              setIsLoading(false)
              if (shouldSuppressWebViewError()) {
                if (__DEV__) {
                  // eslint-disable-next-line no-console
                  console.warn('[app-event-webview] suppressed transient webview http error', event.nativeEvent)
                }
                return
              }
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
