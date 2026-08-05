// ─── Polyfill ─────────────────────────────────────────────────────────────────
// Must be the very first import so the globals are set before @stomp/stompjs
// (or any transitive dependency) runs its module-level code.
// Hermes (RN 0.71+) ships TextEncoder/TextDecoder, but the guard below keeps
// this safe for test environments that may lack them.
import { TextDecoder, TextEncoder } from 'text-encoding'
if (typeof (global as any).TextEncoder === 'undefined') {
  ;(global as any).TextEncoder = TextEncoder
  ;(global as any).TextDecoder = TextDecoder
}

// ─── React / RN ───────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { InteractionManager, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import Constants from 'expo-constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'

// ─── Navigation ───────────────────────────────────────────────────────────────
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'

// ─── React Query ──────────────────────────────────────────────────────────────
import { QueryClientProvider } from '@tanstack/react-query'

// ─── App ──────────────────────────────────────────────────────────────────────
import { useColorScheme } from '@/components/useColorScheme'
import { C } from '../src/theme'
import { AppEventPopupModal, useAppEventPopup } from '../src/features/app-event'
import { getAppEventWebViewRoute } from '../src/features/app-event/lib/targetNavigation'
import { useMe } from '../src/features/profile'
import { TitleAchievementDetector } from '../src/features/profile/ui/TitleAchievementDetector'
import { queryClient } from '../src/lib/query/queryClient'
import { refreshAuthTokens } from '../src/lib/auth/refresh-token'
import { removeRefreshToken } from '../src/lib/storage/secure'
import { useAuthStore } from '../src/store/auth.store'
import { useLikesStore } from '../src/store/likes.store'
import { useFavoritesStore } from '../src/store/favorites.store'
import { reconcilePushDevice } from '../src/features/notification/services/pushDeviceSync'
import {
  getFirebaseNativeUnavailableReason,
  isFirebaseNativeAvailable,
} from '../src/features/notification/services/firebaseNative'
import {
  AppVersionUpdateModal,
  checkAppVersion,
  getCurrentAppVersion,
  getCurrentAppVersionPlatform,
  type AppVersionCheckResult,
} from '../src/features/app-version'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  // '(tabs)' keeps the main app as the back-stack base for authenticated users.
  // The auth gate handles redirecting unauthenticated users to (auth)/login.
  initialRouteName: '(tabs)',
}

const STARTUP_HYDRATION_TIMEOUT_MS = 5000

// React StrictMode can mount the root layout twice in development. Share the
// whole bootstrap promise so startup APIs run once per JS app session.
let startupBootstrapPromise: Promise<{
  appVersionResult: AppVersionCheckResult | null
  canReconcilePushDevice: boolean
}> | null = null

// Keep the splash screen up until fonts and startup hydration have had a
// chance to complete. Ignore duplicate/native timing failures so startup keeps
// moving in release builds.
void SplashScreen.preventAutoHideAsync().catch(() => undefined)

function waitForStartupHydration(): Promise<void> {
  return new Promise((resolve) => {
    let done = false

    const finish = () => {
      if (done) return
      done = true
      clearTimeout(timeout)
      resolve()
    }

    const timeout = setTimeout(() => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[startup] hydration timed out; continuing app launch')
      }
      finish()
    }, STARTUP_HYDRATION_TIMEOUT_MS)

    Promise.allSettled([
      useAuthStore.getState().hydrateAuth(),
      useLikesStore.getState().hydrateLikes(),
      useFavoritesStore.getState().hydrateFavorites(),
    ]).then(finish, finish)
  })
}

async function checkStartupAppVersion(): Promise<AppVersionCheckResult | null> {
  const platform = getCurrentAppVersionPlatform()
  const version = getCurrentAppVersion()

  if (!platform) return null

  try {
    return await checkAppVersion({ platform, version })
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[startup] app version check failed; continuing launch', error)
    }
    return null
  }
}

async function refreshStartupAuthTokens(): Promise<boolean> {
  const refreshResult = await refreshAuthTokens()

  if (refreshResult.ok || refreshResult.reason === 'no-refresh-token') {
    return true
  }

  if (refreshResult.status === 401) {
    // A stale refresh token must not erase a still-usable access token during
    // launch. The normal API 401 flow will clear the full session if access
    // token authentication is also no longer valid.
    await removeRefreshToken()
    return true
  }

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[startup] token refresh failed; continuing launch', {
      status: refreshResult.status,
      errorName: refreshResult.errorName,
    })
  }
  return false
}

function runStartupBootstrap() {
  if (!startupBootstrapPromise) {
    startupBootstrapPromise = (async () => {
      await waitForStartupHydration()
      const appVersionResult = await checkStartupAppVersion()
      const canReconcilePushDevice = await refreshStartupAuthTokens()
      if (canReconcilePushDevice) {
        await reconcileStartupPushDevice()
      }
      return { appVersionResult, canReconcilePushDevice }
    })()
  }
  return startupBootstrapPromise
}

async function reconcileStartupPushDevice(): Promise<void> {
  if (!useAuthStore.getState().isAuthenticated) return

  if (Constants.appOwnership === 'expo' || !isFirebaseNativeAvailable()) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[startup] push-device sync skipped:',
        Constants.appOwnership === 'expo'
          ? 'Expo Go'
          : getFirebaseNativeUnavailableReason() ?? 'unknown Firebase state',
      )
    }
    return
  }

  await reconcilePushDevice()
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    SUIT: require('../assets/fonts/SUIT-Regular.ttf'),
    SUITRegular:  require('../assets/fonts/SUIT-Regular.ttf'),
    SUITMedium:   require('../assets/fonts/SUIT-Medium.ttf'),
    SUITSemiBold: require('../assets/fonts/SUIT-SemiBold.ttf'),
    SUITBold:     require('../assets/fonts/SUIT-Bold.ttf'),
    SUITExtraBold:require('../assets/fonts/SUIT-ExtraBold.ttf'),
    ...FontAwesome.font,
  })

  const [startupReady, setStartupReady] = useState(false)
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false)
  const [appVersionResult, setAppVersionResult] =
    useState<AppVersionCheckResult | null>(null)
  const [appVersionDismissed, setAppVersionDismissed] = useState(false)

  // Surface font errors immediately so Expo Router's ErrorBoundary can catch them.
  useEffect(() => {
    if (fontError) throw fontError
  }, [fontError])

  // Keep the branded splash up while startup work runs in order:
  // local hydration → app-version check → token refresh → push-device reconcile.
  useEffect(() => {
    let mounted = true

    runStartupBootstrap()
      .then(({ appVersionResult }) => {
        if (appVersionResult && mounted) setAppVersionResult(appVersionResult)
        if (mounted) setStartupReady(true)
      })
      .catch((error) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[startup] bootstrap failed; continuing launch', error)
        }
        if (mounted) setStartupReady(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Hide the native splash once fonts are ready, with a short delay so
  // BrandedSplash is already painted before the native splash disappears.
  useEffect(() => {
    if (fontsLoaded) {
      let mounted = true
      const t = setTimeout(() => {
        void SplashScreen.hideAsync()
          .catch(() => undefined)
          .finally(() => {
            if (mounted) setNativeSplashHidden(true)
          })
      }, 1500)
      return () => {
        mounted = false
        clearTimeout(t)
      }
    }
  }, [fontsLoaded])

  if (!fontsLoaded || !startupReady) {
    return <BrandedSplash />
  }

  const appVersionStatus = appVersionResult?.status
  const shouldGateForUpdate =
    appVersionStatus === 'UPDATE_REQUIRED' ||
    (appVersionStatus === 'UPDATE_AVAILABLE' && !appVersionDismissed)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {shouldGateForUpdate ? (
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <BrandedSplash />
            <AppVersionUpdateModal
              visible
              result={appVersionResult}
              onClose={() => setAppVersionDismissed(true)}
            />
          </ThemeProvider>
        ) : (
          <RootLayoutNav appReady={nativeSplashHidden} />
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

// ─── Auth gate ────────────────────────────────────────────────────────────────
// Renders nothing — only drives navigation side-effects.
// Lives inside RootLayoutNav so useSegments/useRouter have navigation context.
//
// Loop prevention:
//   !auth + !inAuth → replace to (auth)/login          [stops: now inAuth = true]
//   auth  + inAuth  → replace to (tabs)                [stops: now inAuth = false]
//   !auth + inAuth  → no-op  (let auth screens handle) [stops]
//   auth  + !inAuth → no-op  (already in main app)     [stops]

function AuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // The typed-routes union guarantees length ≥ 1, but Expo Router can briefly
    // return an empty array on the very first render before navigation settles.
    // @ts-expect-error — TS2367: runtime guard, not needed per the type system.
    if (segments.length === 0) return

    const segmentList = segments as readonly string[]
    const group = segmentList[0]
    const screen = segmentList[1]
    const inAuthGroup = group === '(auth)'
    const inOAuthCallback = group === 'oauth'
    const hasOnboardingToken =
      typeof onboardingToken === 'string' && onboardingToken.trim().length > 0
    const isLoginRoute = inAuthGroup && screen === 'login'
    const isAgreementRoute = inAuthGroup && screen === 'agreement'
    const isOnboardingRoute = inAuthGroup && screen === 'onboarding'
    const isManualRoute = inAuthGroup && screen === 'manual'
    const isMidSignupRoute = isAgreementRoute || isOnboardingRoute || isManualRoute

    if (inOAuthCallback) {
      return
    }

    if (isAuthenticated && inAuthGroup && !isManualRoute) {
      router.replace('/(tabs)')
      return
    }

    if (!isAuthenticated && hasOnboardingToken) {
      if (isMidSignupRoute) {
        return
      }

      if (isLoginRoute || !inAuthGroup) {
        router.replace('/(auth)/agreement')
        return
      }

      router.replace('/(auth)/agreement')
      return
    }

    if (!isAuthenticated && (isMidSignupRoute || !inAuthGroup)) {
      router.replace('/(auth)/login')
      return
    }
  }, [isAuthenticated, onboardingToken, segments, router])

  return null
}

// ─── Branded splash / hydration loading screen ────────────────────────────────
// Shown while fonts are loading OR store hydration (auth/likes/favorites) is
// pending. On a normal native launch the native splash covers this entirely;
// it acts as a JS-side fallback for Expo Go, warm starts, or simulator runs.

const logoWhite = require('../assets/logos/logo-white.png')

function BrandedSplash() {
  return (
    <View style={splashStyles.container}>
      <Image source={logoWhite} style={splashStyles.logo} contentFit="contain" />
    </View>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
})

// ─── Root navigation ──────────────────────────────────────────────────────────

function RootLayoutNav({ appReady }: { appReady: boolean }) {
  const colorScheme = useColorScheme()
  const [appEventModalBlocking, setAppEventModalBlocking] = useState(true)
  const [titleModalVisible, setTitleModalVisible] = useState(false)

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ProfileBootstrap />
      <PushNotificationBootstrap />
      <AppEventPopupBootstrap
        appReady={appReady}
        blocked={titleModalVisible}
        onBlockingChange={setAppEventModalBlocking}
      />
      <TitleAchievementDetector
        blocked={appEventModalBlocking}
        onVisibilityChange={setTitleModalVisible}
      />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="oauth/x" options={{ headerShown: false }} />
        {/* Works detail screen — header managed by Stack.Screen inside the screen */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  )
}

// Fetch the active app popup as soon as the authenticated app shell mounts.
// The modal itself is gated to Home so auth and secondary screens are not
// covered while the query is being resolved.
type AppEventPopupBootstrapProps = {
  appReady: boolean
  blocked: boolean
  onBlockingChange: (blocking: boolean) => void
}

function AppEventPopupBootstrap({
  appReady,
  blocked,
  onBlockingChange,
}: AppEventPopupBootstrapProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const segments = useSegments()
  const router = useRouter()
  const popupQuery = useAppEventPopup(isAuthenticated)
  const popup = popupQuery.data
  const [visible, setVisible] = useState(false)
  const [homeReady, setHomeReady] = useState(false)
  const settledPopupIdRef = useRef<number | null>(null)

  const segmentList = segments as readonly string[]
  const routeResolved = segmentList.length > 0
  const isHomeRoute =
    segmentList[0] === '(tabs)' &&
    (segmentList.length === 1 || segmentList[1] === 'index')

  useEffect(() => {
    if (!appReady || !isHomeRoute) {
      setHomeReady(false)
      return
    }

    let cancelled = false
    let frameId: number | null = null
    const interaction = InteractionManager.runAfterInteractions(() => {
      frameId = requestAnimationFrame(() => {
        if (!cancelled) setHomeReady(true)
      })
    })

    return () => {
      cancelled = true
      interaction.cancel()
      if (frameId != null) cancelAnimationFrame(frameId)
    }
  }, [appReady, isHomeRoute])

  const hasPendingPopup =
    popup != null && settledPopupIdRef.current !== popup.id
  const shouldBlockTitle =
    !routeResolved ||
    (isAuthenticated &&
      isHomeRoute &&
      (!appReady || popupQuery.isFetching || hasPendingPopup || visible))

  useEffect(() => {
    onBlockingChange(shouldBlockTitle)
  }, [onBlockingChange, shouldBlockTitle])

  useEffect(() => {
    if (!isAuthenticated || !isHomeRoute || !homeReady || blocked || !popup) return
    if (settledPopupIdRef.current === popup.id) return

    setVisible(true)
  }, [blocked, homeReady, isAuthenticated, isHomeRoute, popup])

  const settlePopup = () => {
    if (popup) settledPopupIdRef.current = popup.id
    setVisible(false)
  }

  if (!popup) return null

  return (
    <AppEventPopupModal
      visible={visible && appReady && isHomeRoute && !blocked}
      popupId={popup.id}
      title={popup.popupTitle}
      imageUrl={popup.imageUrl}
      content={popup.content}
      ctaText={popup.ctaText}
      exposurePolicy={popup.exposurePolicy}
      onClose={settlePopup}
      onAction={() => {
        settlePopup()
        const webViewRoute = getAppEventWebViewRoute(
          popup.targetId,
          popup.popupTitle,
        )
        if (webViewRoute) {
          router.push(webViewRoute as never)
        }
      }}
    />
  )
}

function ProfileBootstrap() {
  useMe()
  return null
}

// Mounted under the QueryClientProvider so the registration mutation has
// access to React Query. The hook itself short-circuits until the auth
// store reports an authenticated user, so this is safe to mount eagerly.
let warnedExpoGoPushSkip = false

function PushNotificationBootstrap() {
  if (Constants.appOwnership === 'expo') {
    if (__DEV__ && !warnedExpoGoPushSkip) {
      warnedExpoGoPushSkip = true
      // eslint-disable-next-line no-console
      console.warn('[push] device sync skipped in Expo Go; use a dev/native build')
    }
    return null
  }

  const { usePushNotificationBootstrap } = require('../src/features/notification/hooks/usePushNotificationBootstrap') as typeof import('../src/features/notification/hooks/usePushNotificationBootstrap')
  usePushNotificationBootstrap()
  return null
}
