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
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
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
import { useMe } from '../src/features/profile'
import { TitleAchievementDetector } from '../src/features/profile/ui/TitleAchievementDetector'
import { queryClient } from '../src/lib/query/queryClient'
import { useAuthStore } from '../src/store/auth.store'
import { useLikesStore } from '../src/store/likes.store'
import { useFavoritesStore } from '../src/store/favorites.store'
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

  const [authReady, setAuthReady] = useState(false)
  const [appVersionReady, setAppVersionReady] = useState(false)
  const [appVersionResult, setAppVersionResult] =
    useState<AppVersionCheckResult | null>(null)
  const [appVersionDismissed, setAppVersionDismissed] = useState(false)

  // Surface font errors immediately so Expo Router's ErrorBoundary can catch them.
  useEffect(() => {
    if (fontError) throw fontError
  }, [fontError])

  // Hydrate all local stores in parallel as early as possible. A timeout keeps
  // a native storage edge case from trapping release builds on the splash.
  useEffect(() => {
    let mounted = true

    waitForStartupHydration().then(() => {
      if (mounted) setAuthReady(true)
    })

    return () => {
      mounted = false
    }
  }, [])

  // Check app version while the branded splash is still visible. If an update
  // is needed, keep navigation gated so the modal appears before home/auth UI.
  useEffect(() => {
    let mounted = true
    const platform = getCurrentAppVersionPlatform()
    const version = getCurrentAppVersion()

    if (!platform) {
      setAppVersionReady(true)
      return () => {
        mounted = false
      }
    }

    checkAppVersion({ platform, version })
      .then((result) => {
        if (mounted) setAppVersionResult(result)
      })
      .catch((error) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[startup] app version check failed; continuing launch', error)
        }
      })
      .finally(() => {
        if (mounted) setAppVersionReady(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Hide the native splash once fonts are ready, with a short delay so
  // BrandedSplash is already painted before the native splash disappears.
  useEffect(() => {
    if (fontsLoaded) {
      const t = setTimeout(() => {
        void SplashScreen.hideAsync().catch(() => undefined)
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [fontsLoaded])

  if (!fontsLoaded || !authReady || !appVersionReady) {
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
          <RootLayoutNav />
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

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ProfileBootstrap />
      <PushNotificationBootstrap />
      <TitleAchievementDetector />
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
