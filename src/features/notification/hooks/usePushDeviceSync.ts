import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import { useAuthStore } from '../../../store/auth.store'
import {
  getFirebaseNativeUnavailableReason,
  isFirebaseNativeAvailable,
} from '../services/firebaseNative'
import {
  reconcilePushDevice,
  resetPushDeviceSyncCache,
} from '../services/pushDeviceSync'

/**
 * Drives push-device backend reconciliation against the app/auth lifecycle:
 *  - once when the user becomes authenticated
 *  - whenever the app returns to the foreground while authenticated
 *  - clears the in-memory sync cache on sign-out so the next session re-syncs
 *
 * Permission ON/OFF, FCM-token changes and device-meta changes are all
 * resolved inside reconcilePushDevice(); this hook only decides *when* to run
 * it. The reconcile is passive here: it reads existing OS permission but never
 * opens the permission prompt. Calls happen only once authenticated, so the
 * access token is available for the Authorization header. Never throws, never
 * blocks rendering.
 */
export const usePushDeviceSync = (): void => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const appState = useRef<AppStateStatus>(AppState.currentState)
  const warnedUnavailable = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      // Signed out — drop cached sync state so a re-login triggers a fresh sync.
      resetPushDeviceSyncCache()
      return
    }
    if (!isFirebaseNativeAvailable()) {
      if (__DEV__ && !warnedUnavailable.current) {
        warnedUnavailable.current = true
        // eslint-disable-next-line no-console
        console.warn(
          '[push-device] sync skipped:',
          getFirebaseNativeUnavailableReason() ?? 'unknown Firebase state',
        )
      }
      return
    }

    // Initial reconcile on becoming authenticated.
    void reconcilePushDevice()

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current
      appState.current = next
      // Only react to a real transition into the foreground.
      if (/inactive|background/.test(prev) && next === 'active') {
        void reconcilePushDevice()
      }
    })

    return () => {
      sub.remove()
    }
  }, [isAuthenticated])
}
