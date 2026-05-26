import { apiClient } from '../../../lib/api/axios-instance'
import {
  AdminTestDispatchResponseSchema,
  AdminTestPushResponseSchema,
  MarketingConsentResponseSchema,
  NotificationPageResponseSchema,
  NotificationSettingsResponseSchema,
  UnreadCountResponseSchema,
  type AdminTestDispatchPayload,
  type AdminTestPushPayload,
  type MarketingConsentResult,
  type NotificationPage,
  type NotificationSettings,
  type UpdateNotificationSettingsPayload,
} from './notification.schema'

const BASE = '/api/v1/notifications'

// ---------- marketing consent ----------

/** PUT /api/v1/notifications/marketing-consent */
export async function updateMarketingConsent(
  marketingEnabled: boolean,
): Promise<MarketingConsentResult> {
  const res = await apiClient.put(`${BASE}/marketing-consent`, {
    marketingEnabled,
  })
  return MarketingConsentResponseSchema.parse(res.data).result
}

// ---------- notification list ----------

/** GET /api/v1/notifications — cursor-paginated slice. */
export async function getNotifications(params?: {
  cursorId?: number | null
  size?: number
}): Promise<NotificationPage> {
  const { cursorId = null, size = 10 } = params ?? {}
  const res = await apiClient.get(BASE, {
    params: {
      // Only send cursorId when we actually have one (first page omits it).
      ...(cursorId != null ? { cursorId } : {}),
      size,
    },
  })
  return NotificationPageResponseSchema.parse(res.data).result
}

/** PATCH /api/v1/notifications — mark all as read. */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch(BASE)
}

/** PATCH /api/v1/notifications/{id} — mark a single notification as read. */
export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`${BASE}/${id}`)
}

// ---------- settings ----------

/** GET /api/v1/notifications/settings */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const res = await apiClient.get(`${BASE}/settings`)
  return NotificationSettingsResponseSchema.parse(res.data).result
}

/** PATCH /api/v1/notifications/settings (request omits eventBenefitEnabled). */
export async function updateNotificationSettings(
  payload: UpdateNotificationSettingsPayload,
): Promise<NotificationSettings> {
  const res = await apiClient.patch(`${BASE}/settings`, payload)
  return NotificationSettingsResponseSchema.parse(res.data).result
}

// ---------- unread count ----------

/** GET /api/v1/notifications/unread-count */
export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiClient.get(`${BASE}/unread-count`)
  return UnreadCountResponseSchema.parse(res.data).result
}

// ---------- admin / dev test endpoints ----------
// NOTE: The two functions below hit ADMIN-only test endpoints. They exist to
// exercise the push pipeline during development and must NOT be wired into
// production UI by default.

/** POST /api/v1/notifications/admin/test-push — dev/admin only. */
export async function sendAdminTestPush(
  payload: AdminTestPushPayload,
): Promise<string | null | undefined> {
  const res = await apiClient.post(`${BASE}/admin/test-push`, payload)
  return AdminTestPushResponseSchema.parse(res.data).result
}

/** POST /api/v1/notifications/admin/test-dispatch — dev/admin only. */
export async function sendAdminTestDispatch(
  payload: AdminTestDispatchPayload,
): Promise<unknown> {
  const res = await apiClient.post(`${BASE}/admin/test-dispatch`, payload)
  return AdminTestDispatchResponseSchema.parse(res.data).result
}

// NOTE: Device-token registration moved to the real push-device endpoints.
// See pushDevice.api.ts (syncPushDevice / updatePushDeviceFcmToken /
// deletePushDevice) and the pushDeviceSync service for the live flow.
