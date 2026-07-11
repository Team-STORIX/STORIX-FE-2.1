import { getFirebaseMessagingIfAvailable } from './firebaseNative'
import {
  ensurePushNotificationChannel,
  syncAppBadgeCountFromPushData,
} from './notifeeNative'

let registered = false

/**
 * RNFirebase requires background message handlers to be registered at module
 * load time, before React mounts. Keep this file side-effect free until the
 * explicit register call from index.js.
 */
export function registerBackgroundPushHandler(): void {
  if (registered) return
  registered = true

  try {
    const firebase = getFirebaseMessagingIfAvailable()
    if (!firebase) return

    const { messagingModule, messaging } = firebase

    void ensurePushNotificationChannel()

    messagingModule.setBackgroundMessageHandler(messaging, async (remoteMessage) => {
      await syncAppBadgeCountFromPushData(remoteMessage?.data)
    })
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[push] background handler registration failed', err)
    }
  }
}
