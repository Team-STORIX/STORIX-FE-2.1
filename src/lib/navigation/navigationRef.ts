// Centralised navigation helper for imperative navigation outside components.
// Used by: auth.store.ts clearAuth(), axios-instance.ts refresh failure handler.
//
// expo-router's `router` is a module-level singleton safe to call from
// non-component code, as long as the navigation tree has already mounted.

import { router } from 'expo-router'

/**
 * Resets the navigation stack to the login screen.
 *
 * TODO(Phase auth screens): Uncomment the call once app/(auth)/login.tsx exists.
 *   Until then this is a safe no-op so callers can be wired without crashing.
 */
export const resetToLogin = (): void => {
  // router.replace('/(auth)/login')
  void router // reference kept so the import is not tree-shaken before wiring
}
