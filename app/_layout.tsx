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
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'

// ─── React Query ──────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── App ──────────────────────────────────────────────────────────────────────
import { useColorScheme } from '@/components/useColorScheme'
import { useAuthStore } from '../src/store/auth.store'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
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

  // Hydrate auth state from SecureStore as early as possible.
  // Does not call any API — only reads local storage.
  useEffect(() => {
    useAuthStore
      .getState()
      .hydrateAuth()
      .then(() => setAuthReady(true))
      .catch(() => setAuthReady(true)) // still unblock on failure; state stays unauthenticated
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

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  // TODO(Phase auth screens): Add auth-based redirect here once login/home screens exist.
  //   const { isAuthenticated } = useAuthStore()
  //   useEffect(() => {
  //     if (isAuthenticated) router.replace('/(tabs)')
  //     else router.replace('/(auth)/login')
  //   }, [isAuthenticated])

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main app — visible once auth is confirmed */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Auth flow — login, agreement, onboarding */}
        {/* TODO(Phase auth screens): add animation/gesture options once screens exist */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Deep-link screen for TopicRoom chat */}
        <Stack.Screen name="topicroom" options={{ headerShown: false }} />

        {/* Existing modal */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  )
}
