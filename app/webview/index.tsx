import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview'
import { NotificationHeader } from '../../src/features/notification/ui/NotificationHeader'
import {
  getValidHttpUrl,
  isAppEventWebOrigin,
  isTrustedAppEventUrl,
} from '../../src/features/app-event/lib/targetNavigation'
import { useAppEventDetail } from '../../src/features/app-event'
import { refreshAuthTokens } from '../../src/lib/auth/refresh-token'
import { useAuthStore } from '../../src/store/auth.store'
import { C, Magenta, Radius, Typography } from '../../src/theme'

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
  | { type: 'LOGIN_REQUIRED' }
  | { type: 'EVENT_ERROR'; payload: { code?: string; message: string } }

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

function getAppEventIdFromUrl(value: string | null): number | null {
  if (!value) return null

  try {
    const match = new URL(value).pathname.match(/^\/event\/(\d+)\/?$/)
    if (!match) return null

    const appEventId = Number(match[1])
    return Number.isSafeInteger(appEventId) && appEventId > 0
      ? appEventId
      : null
  } catch {
    return null
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
  const appEventId = getAppEventIdFromUrl(url)
  const { data: appEvent } = useAppEventDetail(appEventId)
  const title = appEvent?.name.trim() || '이벤트'
  const webViewSource = useMemo(() => (url ? { uri: url } : null), [url])
  const authInjectionScript = useMemo(
    () => createAuthInjectionScript(accessToken),
    [accessToken],
  )
  const webViewRef = useRef<WebView>(null)
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
          await Linking.openURL(message.payload.url).catch(() => undefined)
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
          return
      }
    },
    [accessToken, authInjectionScript, closeScreen, url],
  )

  const shouldStartLoad = useCallback(
    (request: { url: string }) => {
      if (request.url === 'about:blank' || isAppEventWebOrigin(request.url)) {
        return true
      }

      const externalUrl = getValidHttpUrl(request.url)
      if (externalUrl) {
        void Linking.openURL(externalUrl).catch(() => undefined)
      }
      return false
    },
    [],
  )

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <NotificationHeader title={title} onBack={handleBack} />

      {webViewSource && !hasError ? (
        <View style={styles.content}>
          <WebView
            key={reloadKey}
            ref={webViewRef}
            source={webViewSource}
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
