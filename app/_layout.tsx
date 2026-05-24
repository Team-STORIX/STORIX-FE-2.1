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
import { useMe } from '../src/features/profile'
import { queryClient } from '../src/lib/query/queryClient'
import { useAuthStore } from '../src/store/auth.store'
import { useLikesStore } from '../src/store/likes.store'
import { useFavoritesStore } from '../src/store/favorites.store'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  // '(tabs)' keeps the main app as the back-stack base for authenticated users.
  // The auth gate handles redirecting unauthenticated users to (auth)/login.
  initialRouteName: '(tabs)',
}

// Keep the splash screen up until fonts AND auth hydration are both done.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  })

  const [authReady, setAuthReady] = useState(false)

  // Surface font errors immediately so Expo Router's ErrorBoundary can catch them.
  useEffect(() => {
    if (fontError) throw fontError
  }, [fontError])

  // Hydrate all local stores in parallel as early as possible.
  // Promise.allSettled ensures a single failure never blocks app startup.
  useEffect(() => {
    Promise.allSettled([
      useAuthStore.getState().hydrateAuth(),
      useLikesStore.getState().hydrateLikes(),
      useFavoritesStore.getState().hydrateFavorites(),
    ]).then(() => setAuthReady(true))
  }, [])

  // Hide the native splash once fonts are ready, with a short delay so
  // BrandedSplash is already painted before the native splash disappears.
  useEffect(() => {
    if (fontsLoaded) {
      const t = setTimeout(() => SplashScreen.hideAsync(), 150)
      return () => clearTimeout(t)
    }
  }, [fontsLoaded])

  if (!fontsLoaded || !authReady) {
    return <BrandedSplash />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
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
    const hasOnboardingToken =
      typeof onboardingToken === 'string' && onboardingToken.trim().length > 0
    const isLoginRoute = inAuthGroup && screen === 'login'
    const isAgreementRoute = inAuthGroup && screen === 'agreement'
    const isOnboardingRoute = inAuthGroup && screen === 'onboarding'
    const isMidSignupRoute = isAgreementRoute || isOnboardingRoute

    if (isAuthenticated && inAuthGroup) {
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

const logoWhite = require('../assets/icons/common/logo-white.png')

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
    backgroundColor: '#000000',
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
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
function PushNotificationBootstrap() {
  if (Constants.appOwnership === 'expo') {
    return null
  }

  const { usePushNotificationBootstrap } = require('../src/features/notification/hooks/usePushNotificationBootstrap') as typeof import('../src/features/notification/hooks/usePushNotificationBootstrap')
  usePushNotificationBootstrap()
  return null
}
