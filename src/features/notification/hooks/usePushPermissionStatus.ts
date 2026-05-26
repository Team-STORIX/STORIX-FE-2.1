import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import { getPushPermissionStatus } from '../services/pushPermission'
import { reconcilePushDevice } from '../services/pushDeviceSync'

/**
 * Tracks the CURRENT OS push-permission state for passive UI (the "알림 수신"
 * row). Critically, it only *reads* the status — it never prompts — so simply
 * opening the settings screen cannot trigger the system permission dialog.
 *
 * Refreshes whenever the app returns to the foreground (e.g. after the user
 * toggled the permission in OS Settings). On an OFF→ON transition it kicks the
 * existing push-device reconcile so the backend re-registers the device; the
 * reconcile self-dedups and never throws.
 */
export function usePushPermissionStatus() {
  const [granted, setGranted] = useState<boolean | null>(null)
  const grantedRef = useRef<boolean | null>(null)

  const refresh = useCallback(async () => {
    const result = await getPushPermissionStatus()
    const was = grantedRef.current
    grantedRef.current = result.granted
    setGranted(result.granted)

    // OFF→ON: re-sync the device token with the backend (best-effort).
    if (was === false && result.granted) {
      void reconcilePushDevice()
    }
  }, [])

  useEffect(() => {
    void refresh()

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void refresh()
    })
    return () => sub.remove()
  }, [refresh])

  return { granted, refresh }
}
