import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  markAllNotificationsRead,
  markNotificationRead,
  sendAdminTestDispatch,
  sendAdminTestPush,
  updateMarketingConsent,
} from '../api/notification.api'
import { notificationKeys } from '../api/notification.keys'
import type {
  AdminTestDispatchPayload,
  AdminTestPushPayload,
  NotificationSettings,
} from '../api/notification.schema'
import {
  clearAndroidDisplayedNotifications,
  refreshAppBadgeCount,
} from '../services/notifeeNative'

async function syncAppBadgeCache(
  qc: ReturnType<typeof useQueryClient>,
): Promise<void> {
  try {
    const count = await refreshAppBadgeCount()
    qc.setQueryData(notificationKeys.badgeCount, count)
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] unread badge sync failed', err)
    }
  }
}

async function clearAndroidNotifications(args: {
  notificationId?: number
  all?: boolean
}): Promise<void> {
  try {
    await clearAndroidDisplayedNotifications(args)
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] Android notification clear failed', err)
    }
  }
}

/** Mark every notification as read. */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: notificationKeys.listRoot })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
      await clearAndroidNotifications({ all: true })
      await syncAppBadgeCache(qc)
    },
  })
}

/** Mark a single notification as read. */
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: async (_data, id) => {
      qc.invalidateQueries({ queryKey: notificationKeys.listRoot })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
      await clearAndroidNotifications({ notificationId: id })
      await syncAppBadgeCache(qc)
    },
  })
}

/**
 * Update marketing-consent opt-in. This also affects eventBenefitEnabled in
 * the notification-settings resource, so keep that cache aligned.
 */
export function useUpdateMarketingConsent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (marketingEnabled: boolean) =>
      updateMarketingConsent(marketingEnabled),
    onMutate: async (marketingEnabled) => {
      await qc.cancelQueries({ queryKey: notificationKeys.settings })
      const previous = qc.getQueryData<NotificationSettings>(
        notificationKeys.settings,
      )
      if (previous) {
        qc.setQueryData<NotificationSettings>(notificationKeys.settings, {
          ...previous,
          eventBenefitEnabled: marketingEnabled,
        })
      }
      return { previous }
    },
    onError: (_err, _marketingEnabled, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(notificationKeys.settings, ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.settings })
    },
  })
}

// ---------- admin / dev test mutations ----------
// These call ADMIN-only test endpoints. Keep them out of production UI; they
// are exposed here only for dev tooling / QA.

/** Dev/admin: send a raw FCM test push. */
export function useAdminTestPush() {
  return useMutation({
    mutationFn: (payload: AdminTestPushPayload) => sendAdminTestPush(payload),
  })
}

/**
 * Dev/admin: dispatch a synthetic in-app notification. Because this can create
 * a real notification, it invalidates the list + unread count on success.
 */
export function useAdminTestDispatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminTestDispatchPayload) =>
      sendAdminTestDispatch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.listRoot })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
      void syncAppBadgeCache(qc)
    },
  })
}
