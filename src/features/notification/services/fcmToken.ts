import { Platform } from 'react-native'
import {
  getMessaging,
  getToken,
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
  try {
    if (Platform.OS === 'ios') {
      // Idempotent — RNFirebase ignores duplicate calls.
      await registerDeviceForRemoteMessages(messaging())
    }

    try {
      const token = await getToken(messaging())
      return typeof token === 'string' && token.length > 0 ? token : null
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Retry once for the common iOS race where APNs has not yet handed
      // back a token. Anything else is non-recoverable here.
      if (Platform.OS === 'ios' && /apns|no apns token/i.test(message)) {
        await sleep(APNS_RETRY_DELAY_MS)
        try {
          const token = await getToken(messaging())
          return typeof token === 'string' && token.length > 0 ? token : null
        } catch (retryErr) {
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
  const unsubscribe = onTokenRefresh(messaging(), (token) => {
    if (typeof token === 'string' && token.length > 0) {
      onRefresh(token)
    }
  })
  return unsubscribe
}
