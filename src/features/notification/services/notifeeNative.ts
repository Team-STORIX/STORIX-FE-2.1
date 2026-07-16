import { getUnreadNotificationCount } from '../api/notification.api'
import { Platform } from 'react-native'
import {
  getPushTitleBody,
  parsePushNotificationData,
  type ParsedPushPayload,
} from './pushPayload'

export const PUSH_ANDROID_CHANNEL_ID = 'storix_default_high'

let channelReady: Promise<string> | null = null
let badgeOperation: Promise<unknown> = Promise.resolve()
let notifeeUnavailable = false

type NotifeeNative = typeof import('@notifee/react-native')

function loadNotifee(): NotifeeNative | null {
  if (notifeeUnavailable) return null

  try {
    return require('@notifee/react-native') as NotifeeNative
  } catch (err) {
    markNotifeeUnavailable('[push] Notifee is unavailable', err)
    return null
  }
}

function markNotifeeUnavailable(message: string, err: unknown): void {
  notifeeUnavailable = true
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(message, err)
  }
}

function toBadgeCount(value: unknown): number | null {
  if (value == null) return null
  const n = Number(String(value).trim())
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

/**
 * iOS badge writes can originate from a push, an app-resume refresh, and a
 * read mutation at nearly the same time. Keep their invocation order so an
 * older push count cannot overwrite a newer server count after the fact.
 */
function enqueueBadgeOperation<T>(operation: () => Promise<T>): Promise<T> {
  const queued = badgeOperation.catch(() => undefined).then(operation)
  badgeOperation = queued.then(
    () => undefined,
    () => undefined,
  )
  return queued
}

async function setNativeIosBadgeCount(count: number): Promise<void> {
  if (Platform.OS !== 'ios') return

  const notifeeModule = loadNotifee()
  if (!notifeeModule) return
  await notifeeModule.default.setBadgeCount(count)
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
  const badgeCount = toBadgeCount(count)
  if (badgeCount == null) return

  await enqueueBadgeOperation(async () => {
    try {
      await setNativeIosBadgeCount(badgeCount)
    } catch (err) {
      markNotifeeUnavailable('[push] Notifee badge update failed', err)
    }
  })
}

export async function syncAppBadgeCountFromPushData(
  data: unknown,
): Promise<number | null> {
  const unreadCount = getUnreadCountFromPushData(data)
  if (unreadCount == null) return null
  await setAppBadgeCount(unreadCount)
  return unreadCount
}

export async function refreshUnreadBadgeCount(): Promise<number> {
  return enqueueBadgeOperation(async () => {
    const count = await getUnreadNotificationCount()
    await setNativeIosBadgeCount(count)
    return count
  })
}

/**
 * Android launchers derive their notification dot from displayed system
 * notifications, not Notifee's iOS-only application badge count. We can
 * remove notifications that this app has displayed; background FCM
 * notification messages still need a backend-owned ID strategy for exact
 * per-notification cancellation.
 */
export async function clearAndroidDisplayedNotifications(args: {
  notificationId?: number
  all?: boolean
}): Promise<void> {
  if (Platform.OS !== 'android') return

  const notifeeModule = loadNotifee()
  if (!notifeeModule) return

  if (args.all) {
    await notifeeModule.default.cancelAllNotifications()
    return
  }

  if (args.notificationId != null) {
    await notifeeModule.default.cancelNotification(String(args.notificationId))
  }
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

  try {
    await notifeeModule.default.displayNotification({
      ...(args.payload?.notificationId != null
        ? { id: String(args.payload.notificationId) }
        : {}),
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
        ...(args.payload?.unreadCount != null
          ? { badgeCount: args.payload.unreadCount }
          : {}),
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    })
  } catch (err) {
    markNotifeeUnavailable('[push] foreground notification display failed', err)
  }
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
