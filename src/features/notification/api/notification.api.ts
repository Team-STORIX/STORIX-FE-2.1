import { apiClient } from '../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../lib/api/types'
import type { RegisterDeviceTokenPayload } from '../types'
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

// TODO(PUSH-2-BE): replace once the backend exposes the real endpoint.
// The path below is the agreed-upon convention used elsewhere in the API
// surface (`/api/v1/<domain>/<resource>`); confirm with the BE spec and
// adjust before enabling real registration.
const REGISTER_DEVICE_TOKEN_PATH = '/api/v1/notifications/device-tokens'

/**
 * Registers a device FCM token with the backend so server-initiated pushes
 * can be routed to this device. Returns the API envelope as-is — the caller
 * decides what to do with the (likely empty) result.
 *
 * Behaviour while the BE endpoint is not yet implemented:
 *  - Short-circuits with a synthetic success envelope so the bootstrap flow
 *    remains exercised. No network call is made in any build.
 */
export const registerDeviceToken = async (
  payload: RegisterDeviceTokenPayload,
): Promise<ApiResponse<null>> => {
  // TODO(PUSH-2-BE): remove this short-circuit once the endpoint is live.
  const ENDPOINT_AVAILABLE = false

  if (!ENDPOINT_AVAILABLE) {
    return {
      isSuccess: true,
      code: 'PUSH_DEV_NOOP',
      message: 'Device token registration is a dev no-op until the backend endpoint exists.',
      result: null,
      timestamp: new Date().toISOString(),
    }
  }

  const res = await apiClient.post(REGISTER_DEVICE_TOKEN_PATH, payload)
  return res.data as ApiResponse<null>
}
