import { getUnreadNotificationCount } from '../api/notification.api'
import {
  getPushTitleBody,
  parsePushNotificationData,
  type ParsedPushPayload,
} from './pushPayload'

export const PUSH_ANDROID_CHANNEL_ID = 'storix_default_high'

let channelReady: Promise<string> | null = null

type NotifeeNative = typeof import('@notifee/react-native')

function loadNotifee(): NotifeeNative | null {
  try {
    return require('@notifee/react-native') as NotifeeNative
  } catch {
    return null
  }
}

function toBadgeCount(value: unknown): number | null {
  if (value == null) return null
  const n = Number(String(value).trim())
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

export function getUnreadCountFromPushData(data: unknown): number | null {
  const payload = parsePushNotificationData(data)
  return toBadgeCount(payload?.unreadCount)
}

export async function ensurePushNotificationChannel(): Promise<string> {
  const notifeeModule = loadNotifee()
  if (!notifeeModule) return PUSH_ANDROID_CHANNEL_ID

  if (!channelReady) {
    channelReady = notifeeModule.default.createChannel({
      id: PUSH_ANDROID_CHANNEL_ID,
      name: 'STORIX 알림',
      importance: notifeeModule.AndroidImportance.HIGH,
      visibility: notifeeModule.AndroidVisibility.PUBLIC,
      sound: 'default',
    })
  }
  return channelReady
}

export async function setAppBadgeCount(count: number): Promise<void> {
  const notifeeModule = loadNotifee()
  if (!notifeeModule) return

  const badgeCount = toBadgeCount(count)
  if (badgeCount == null) return
  await notifeeModule.default.setBadgeCount(badgeCount)
}

export async function syncAppBadgeCountFromPushData(data: unknown): Promise<void> {
  const unreadCount = getUnreadCountFromPushData(data)
  if (unreadCount == null) return
  await setAppBadgeCount(unreadCount)
}

export async function refreshUnreadBadgeCount(): Promise<number> {
  const count = await getUnreadNotificationCount()
  await setAppBadgeCount(count)
  return count
}

export async function displayForegroundPushNotification(args: {
  payload: ParsedPushPayload | null
  notification?: { title?: string | null; body?: string | null }
}): Promise<void> {
  const notifeeModule = loadNotifee()
  if (!notifeeModule) return

  const { title, body } = getPushTitleBody(args.payload, args.notification)
  if (!title && !body) return

  const channelId = await ensurePushNotificationChannel()

  await notifeeModule.default.displayNotification({
    title,
    body,
    data: args.payload?.raw,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      smallIcon: 'ic_launcher',
      importance: notifeeModule.AndroidImportance.HIGH,
    },
    ios: {
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  })
}

export function subscribeNotifeeForegroundPress(
  handler: (data: unknown) => void,
): () => void {
  const notifeeModule = loadNotifee()
  if (!notifeeModule) return () => {}

  return notifeeModule.default.onForegroundEvent((event) => {
    if (event.type !== notifeeModule.EventType.PRESS) return
    handler(event.detail.notification?.data)
  })
}

export async function getInitialNotifeeNotificationData(): Promise<unknown | null> {
  const notifeeModule = loadNotifee()
  if (!notifeeModule) return null

  const initialNotification = await notifeeModule.default.getInitialNotification()
  return initialNotification?.notification?.data ?? null
}
