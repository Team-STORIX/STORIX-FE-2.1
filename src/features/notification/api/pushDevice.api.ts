import { apiClient } from '../../../lib/api/axios-instance'
import {
  PushDeviceResponseSchema,
  type SyncPushDevicePayload,
  type UpdateFcmTokenPayload,
} from './pushDevice.schema'

const BASE = '/api/v1/push-devices'

/**
 * POST /api/v1/push-devices/sync
 * Synchronises one device's push status + FCM token with the backend. Call on
 * foreground entry after auth, on permission OFF→ON, and on device-meta change.
 */
export async function syncPushDevice(
  payload: SyncPushDevicePayload,
): Promise<void> {
  const res = await apiClient.post(`${BASE}/sync`, payload)
  PushDeviceResponseSchema.parse(res.data)
}

/**
 * PATCH /api/v1/push-devices/fcm-token
 * Updates only the FCM token. A /sync must have happened first, otherwise the
 * backend has no device row to update.
 */
export async function updatePushDeviceFcmToken(
  payload: UpdateFcmTokenPayload,
): Promise<void> {
  const res = await apiClient.patch(`${BASE}/fcm-token`, payload)
  PushDeviceResponseSchema.parse(res.data)
}

/**
 * DELETE /api/v1/push-devices/{installationId}
 * Deactivates this device's push token on the backend. Call on permission
 * ON→OFF.
 */
export async function deletePushDevice(installationId: string): Promise<void> {
  const res = await apiClient.delete(
    `${BASE}/${encodeURIComponent(installationId)}`,
  )
  PushDeviceResponseSchema.parse(res.data)
}
