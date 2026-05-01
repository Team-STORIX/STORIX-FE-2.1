// Centralised navigation helper for imperative navigation outside components.
// Used by: auth.store.ts clearAuth(), axios-instance.ts refresh failure handler.
//
// expo-router's `router` is a module-level singleton safe to call from
// non-component code once the navigation tree has mounted.
// In practice this is always the case by the time clearAuth() or the
// refresh-failure interceptor runs.

import { router } from 'expo-router'

/**
 * Resets the navigation stack to the login screen.
 * Safe to call from store actions and axios interceptors.
 * Silently no-ops if navigation is not yet ready (e.g. tests, early init).
 */
export const resetToLogin = (): void => {
  try {
    router.replace('/(auth)/login')
  } catch {
    // Navigation container not yet mounted — ignore.
  }
}
