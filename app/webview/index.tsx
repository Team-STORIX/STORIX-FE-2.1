import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView, type WebViewNavigation } from 'react-native-webview'

import { NotificationHeader } from '../../src/features/notification/ui/NotificationHeader'
import { getValidHttpUrl } from '../../src/features/app-event/lib/targetNavigation'
import { C, Magenta, Radius, Typography } from '../../src/theme'

function getSingleParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null
}

export default function SharedWebViewScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{
    url?: string | string[]
    title?: string | string[]
  }>()
  const url = getValidHttpUrl(getSingleParam(params.url))
  const title = getSingleParam(params.title)?.trim() || '이벤트'
  // TODO(APP-EVENT-AUTH): Add authentication here only after backend/product
  // defines a WebView authentication contract. Never append tokens to the URL.
  const webViewSource = useMemo(() => (url ? { uri: url } : null), [url])
  const webViewRef = useRef<WebView>(null)
  const canGoBackRef = useRef(false)
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
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
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
