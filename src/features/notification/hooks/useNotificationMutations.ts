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
} from '../api/notification.schema'

/** Mark every notification as read. */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.listRoot })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
    },
  })
}

/** Mark a single notification as read. */
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.listRoot })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
    },
  })
}

/**
 * Update marketing-consent opt-in. This endpoint does not affect the
 * notification-settings resource, so we deliberately do NOT invalidate
 * ['notifications','settings'] to avoid over-fetching.
 */
export function useUpdateMarketingConsent() {
  return useMutation({
    mutationFn: (marketingEnabled: boolean) =>
      updateMarketingConsent(marketingEnabled),
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
    },
  })
}
