import { Platform } from 'react-native'
import {
  getAPNSToken,
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging'

// Brief wait before retrying getToken() when APNs has not yet attached a token
// to the app. Empirically RNFirebase resolves this within a few hundred ms,
// but we leave headroom for slow simulators.
const APNS_RETRY_DELAY_MS = 1_500

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const messaging = () => getMessaging()

// TODO(PUSH_DIAG): remove [PUSH_DIAG] logs after delivery is confirmed.
const tokenPrefix = (t: string | null | undefined): string =>
  typeof t === 'string' && t.length > 0
    ? `${t.slice(0, 12)}…(len=${t.length})`
    : String(t)

/**
 * Fetches the device's current FCM registration token, returning null if the
 * token cannot be obtained (permission denied, APNs not ready, simulator
 * without push capability, etc.). Never throws.
 *
 * On iOS we explicitly register for remote messages first — without this the
 * APNs token is not assigned and getToken() fails with
 * "apns-token-not-set yet" on first launch.
 */
export const getFcmDeviceToken = async (): Promise<string | null> => {
  // eslint-disable-next-line no-console
  console.log('[PUSH_DIAG] getFcmDeviceToken start', { platform: Platform.OS })

  try {
    if (Platform.OS === 'ios') {
      try {
        const alreadyRegistered = isDeviceRegisteredForRemoteMessages(
          messaging(),
        )
        // eslint-disable-next-line no-console
        console.log(
          '[PUSH_DIAG] isDeviceRegisteredForRemoteMessages',
          alreadyRegistered,
        )
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(
          '[PUSH_DIAG] isDeviceRegisteredForRemoteMessages threw',
          err,
        )
      }

      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] registerDeviceForRemoteMessages start')
      // Idempotent — RNFirebase ignores duplicate calls.
      await registerDeviceForRemoteMessages(messaging())
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] registerDeviceForRemoteMessages done')

      try {
        // eslint-disable-next-line no-console
        console.log('[PUSH_DIAG] getAPNSToken start')
        const apns = await getAPNSToken(messaging())
        // eslint-disable-next-line no-console
        console.log('[PUSH_DIAG] getAPNSToken result', {
          present: !!apns,
          preview: tokenPrefix(apns),
        })
        if (__DEV__ && typeof apns === 'string' && apns.length > 0) {
          // eslint-disable-next-line no-console
          console.log('[PUSH_DIAG] APNS_TOKEN_FULL', apns)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('[PUSH_DIAG] getAPNSToken error', err)
      }
    }

    try {
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] getToken start')
      const token = await getToken(messaging())
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] getToken success', {
        preview: tokenPrefix(token),
      })
      if (__DEV__ && typeof token === 'string' && token.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[PUSH_DIAG] FCM_REGISTRATION_TOKEN_FULL', token)
      }
      return typeof token === 'string' && token.length > 0 ? token : null
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] getToken error', message)
      // Retry once for the common iOS race where APNs has not yet handed
      // back a token. Anything else is non-recoverable here.
      if (Platform.OS === 'ios' && /apns|no apns token/i.test(message)) {
        await sleep(APNS_RETRY_DELAY_MS)
        try {
          // eslint-disable-next-line no-console
          console.log('[PUSH_DIAG] getToken retry start')
          const token = await getToken(messaging())
          // eslint-disable-next-line no-console
          console.log('[PUSH_DIAG] getToken retry success', {
            preview: tokenPrefix(token),
          })
          if (__DEV__ && typeof token === 'string' && token.length > 0) {
            // eslint-disable-next-line no-console
            console.log('[PUSH_DIAG] FCM_REGISTRATION_TOKEN_FULL', token)
          }
          return typeof token === 'string' && token.length > 0 ? token : null
        } catch (retryErr) {
          // eslint-disable-next-line no-console
          console.log('[PUSH_DIAG] getToken retry failed', retryErr)
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[push] getToken retry failed', retryErr)
          }
          return null
        }
      }

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[push] getToken failed', err)
      }
      return null
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('[PUSH_DIAG] registerDeviceForRemoteMessages threw', err)
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[push] registerDeviceForRemoteMessages failed', err)
    }
    return null
  }
}

/**
 * Subscribes to FCM token rotation. Returns an unsubscribe function suitable
 * for use as a React effect cleanup. The callback receives the new token
 * string; consumers should re-register it with the backend.
 */
export const subscribeFcmTokenRefresh = (
  onRefresh: (token: string) => void,
): (() => void) => {
  // eslint-disable-next-line no-console
  console.log('[PUSH_DIAG] subscribeFcmTokenRefresh mounted')
  const unsubscribe = onTokenRefresh(messaging(), (token) => {
    // eslint-disable-next-line no-console
    console.log('[PUSH_DIAG] onTokenRefresh fired', {
      preview: tokenPrefix(token),
    })
    if (__DEV__ && typeof token === 'string' && token.length > 0) {
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] FCM_REGISTRATION_TOKEN_FULL', token)
    }
    if (typeof token === 'string' && token.length > 0) {
      onRefresh(token)
    }
  })
  return () => {
    // eslint-disable-next-line no-console
    console.log('[PUSH_DIAG] subscribeFcmTokenRefresh unmounted')
    unsubscribe()
  }
}
