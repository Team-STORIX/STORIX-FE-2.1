import { getNotificationBadgeCount } from '../api/notification.api'
import { Image, Platform } from 'react-native'
import {
  getPushTitleBody,
  isTopicRoomChatPayload,
  parsePushNotificationData,
  type ParsedPushPayload,
} from './pushPayload'

export const PUSH_ANDROID_CHANNEL_ID = 'storix_default_high'

const defaultProfileImage = require('../../../../assets/placeholders/profile-default.png')

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

async function setNativeBadgeCount(count: number): Promise<void> {
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
      await setNativeBadgeCount(badgeCount)
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

export async function refreshAppBadgeCount(): Promise<number> {
  return enqueueBadgeOperation(async () => {
    const count = await getNotificationBadgeCount()
    await setNativeBadgeCount(count)
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

export function getTopicRoomNotificationThreadId(roomId: number): string {
  return `topic-room-${roomId}`
}

/**
 * Removes only the OS tray notifications that belong to one topic room.
 * Android chat notifications use the room thread as their stable Notifee ID;
 * iOS notifications are server-rendered, so their data/thread metadata must be
 * inspected before cancelling the matching delivered notification IDs.
 */
export async function clearTopicRoomDisplayedNotifications(
  roomId: number,
): Promise<void> {
  if (!Number.isFinite(roomId) || roomId <= 0) return

  const notifeeModule = loadNotifee()
  if (!notifeeModule) return

  const threadId = getTopicRoomNotificationThreadId(roomId)

  if (Platform.OS === 'android') {
    await notifeeModule.default.cancelNotification(threadId)
  }

  const displayed = await notifeeModule.default.getDisplayedNotifications()
  const matchingIds = displayed.flatMap((item) => {
    const notification = item.notification
    const dataThreadId = notification.data?.threadId
    const iosThreadId = notification.ios?.threadId
    const androidGroupId = notification.android?.groupId
    const notificationId = notification.id ?? item.id

    const matches =
      dataThreadId === threadId ||
      iosThreadId === threadId ||
      androidGroupId === threadId ||
      notificationId === threadId

    return matches && notificationId ? [notificationId] : []
  })

  if (matchingIds.length > 0) {
    await notifeeModule.default.cancelDisplayedNotifications(matchingIds)
  }
}

export async function displayForegroundPushNotification(args: {
  payload: ParsedPushPayload | null
  notification?: { title?: string | null; body?: string | null }
}): Promise<void> {
  const notifeeModule = loadNotifee()
  if (!notifeeModule) return

  if (Platform.OS === 'android' && isTopicRoomChatPayload(args.payload)) {
    await displayTopicRoomChatNotification(args.payload)
    return
  }

  if (Platform.OS === 'ios' && isTopicRoomChatPayload(args.payload)) {
    await displayIOSTopicRoomChatNotification(args.payload)
    return
  }

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

function getDefaultProfileImageUri(): string | null {
  return Image.resolveAssetSource(defaultProfileImage)?.uri ?? null
}

/**
 * Foreground iOS messages do not pass through the Notification Service
 * Extension. Display them as communication notifications here so their room
 * name and sender avatar match background/terminated chat pushes.
 */
async function displayIOSTopicRoomChatNotification(
  payload: ParsedPushPayload,
): Promise<void> {
  const notifeeModule = loadNotifee()
  if (!notifeeModule) return

  const threadId =
    payload.threadId ??
    (payload.targetId != null
      ? getTopicRoomNotificationThreadId(payload.targetId)
      : `topic-room-chat-${payload.notificationId ?? Date.now()}`)
  const roomName = payload.roomName ?? payload.subtitle ?? ''
  const messageCount = Math.max(1, payload.messageCount ?? 1)
  const latestSender = payload.recentSenders[0]
  const senderName =
    latestSender?.nickname ?? payload.senderNickname ?? payload.title ?? '새 메시지'
  const displayTitle =
    messageCount > 1 ? `새 메시지 ${messageCount}건` : senderName
  const profileIcon =
    latestSender?.profileImageUrl ??
    payload.senderProfileImageUrl ??
    getDefaultProfileImageUri() ??
    undefined

  await notifeeModule.default.displayNotification({
    id: threadId,
    title: displayTitle,
    ...(roomName ? { subtitle: roomName } : {}),
    body: payload.body ?? '',
    data: payload.raw,
    ios: {
      threadId,
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
      communicationInfo: {
        conversationId: threadId,
        body: payload.body ?? '',
        ...(roomName ? { groupName: roomName } : {}),
        ...(profileIcon ? { groupAvatar: profileIcon } : {}),
        sender: {
          id: latestSender?.userId ?? `${threadId}:sender`,
          // Notifee rebuilds iOS communication notification content from this
          // person and overwrites the top-level title. Preserve the bundled
          // "새 메시지 n건" title here while keeping the real sender ID/avatar.
          displayName: displayTitle,
          ...(profileIcon ? { avatar: profileIcon } : {}),
        },
      },
    },
  })
}

/**
 * Displays Android's data-only TOPIC_ROOM_CHAT payload. A stable room-scoped
 * ID replaces the previous notification from the same room, while
 * MessagingStyle supplies the conversation avatar and app identity badge.
 */
export async function displayTopicRoomChatNotification(
  payload: ParsedPushPayload,
): Promise<void> {
  if (Platform.OS !== 'android' || !isTopicRoomChatPayload(payload)) return
  if (payload.targetId == null) return

  const notifeeModule = loadNotifee()
  if (!notifeeModule) return

  const channelId = await ensurePushNotificationChannel()
  const threadId =
    payload.threadId ?? getTopicRoomNotificationThreadId(payload.targetId)
  const roomName = payload.roomName ?? payload.subtitle ?? ''
  const messageCount = Math.max(1, payload.messageCount ?? 1)
  const senderName = payload.senderNickname ?? payload.title ?? '새 메시지'
  const displayTitle =
    messageCount > 1 ? `새 메시지 ${messageCount}건` : senderName
  const profileIcon =
    payload.senderProfileImageUrl ?? getDefaultProfileImageUri() ?? undefined

  const sender = {
    name: displayTitle,
    id: `${threadId}:sender`,
    ...(profileIcon ? { icon: profileIcon } : {}),
  }

  await notifeeModule.default.displayNotification({
    id: threadId,
    title: displayTitle,
    body: roomName ? `${roomName}\n${payload.body ?? ''}` : payload.body ?? '',
    data: payload.raw,
    android: {
      channelId,
      pressAction: { id: 'default' },
      smallIcon: 'ic_launcher',
      importance: notifeeModule.AndroidImportance.HIGH,
      groupId: threadId,
      ...(profileIcon ? { largeIcon: profileIcon } : {}),
      circularLargeIcon: true,
      style: {
        type: notifeeModule.AndroidStyle.MESSAGING,
        person: { name: 'STORIX', id: 'storix-current-user' },
        messages: [
          {
            text: payload.body ?? '',
            timestamp: Date.now(),
            person: sender,
          },
        ],
        title: roomName || displayTitle,
        group: messageCount > 1,
      },
      ...(payload.unreadCount != null
        ? { badgeCount: payload.unreadCount }
        : {}),
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
