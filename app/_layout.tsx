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
import 'react-native-reanimated'

// ─── Navigation ───────────────────────────────────────────────────────────────
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'

// ─── React Query ──────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── App ──────────────────────────────────────────────────────────────────────
import { useColorScheme } from '@/components/useColorScheme'
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

// QueryClient is created once at module level — one instance for the app's lifetime.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1_000, // 1 minute
      retry: 1,
    },
  },
})

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

  // Hide the splash screen only after both async gates pass.
  useEffect(() => {
    if (fontsLoaded && authReady) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, authReady])

  // Render nothing while splash is visible — the native splash covers the screen.
  if (!fontsLoaded || !authReady) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
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
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // The typed-routes union guarantees length ≥ 1, but Expo Router can briefly
    // return an empty array on the very first render before navigation settles.
    // @ts-expect-error — TS2367: runtime guard, not needed per the type system.
    if (segments.length === 0) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, segments, router])

  return null
}

// ─── Root navigation ──────────────────────────────────────────────────────────

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="topicroom" options={{ headerShown: false }} />
        {/* Works detail screen — header managed by Stack.Screen inside the screen */}
        <Stack.Screen name="works" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  )
}
