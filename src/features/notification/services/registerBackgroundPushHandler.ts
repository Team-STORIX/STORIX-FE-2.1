import { getFirebaseMessagingIfAvailable } from './firebaseNative'
import {
  ensurePushNotificationChannel,
  syncAppBadgeCountFromPushData,
} from './notifeeNative'
import {
  isTopicRoomChatPayload,
  parsePushNotificationData,
} from './pushPayload'

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
      const payload = parsePushNotificationData(remoteMessage?.data)

      // Android TOPIC_ROOM_CHAT pushes are data-only. Their visual notification
      // must be rendered by the app here; the actual MessagingStyle renderer is
      // intentionally kept separate so its design can follow the approved UI.
      if (__DEV__ && isTopicRoomChatPayload(payload)) {
        // eslint-disable-next-line no-console
        console.log('[push] background topic-room chat received', {
          roomId: payload.targetId,
          threadId: payload.threadId,
          messageCount: payload.messageCount,
        })
      }

      await syncAppBadgeCountFromPushData(remoteMessage?.data)
    })
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[push] background handler registration failed', err)
    }
  }
}
