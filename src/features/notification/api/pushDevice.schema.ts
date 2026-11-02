import { z } from 'zod'

import { CommonApiEnvelope } from './notification.schema'

// ---------- platform enum ----------

export const OsPlatformSchema = z.enum(['IOS', 'ANDROID'])
export type OsPlatform = z.infer<typeof OsPlatformSchema>

// ---------- request payloads ----------

/** POST /api/v1/push-devices/sync */
export const SyncPushDevicePayloadSchema = z.object({
  installationId: z.string(),
  fcmToken: z.string(),
  osPlatform: OsPlatformSchema,
  appVersion: z.string(),
  osVersion: z.string(),
  deviceModel: z.string(),
})
export type SyncPushDevicePayload = z.infer<typeof SyncPushDevicePayloadSchema>

/** PATCH /api/v1/push-devices/fcm-token */
export const UpdateFcmTokenPayloadSchema = z.object({
  installationId: z.string(),
  fcmToken: z.string(),
})
export type UpdateFcmTokenPayload = z.infer<typeof UpdateFcmTokenPayloadSchema>

// ---------- response ----------
// All three push-device endpoints return the common envelope with an empty
// `result` object. We only assert envelope shape; the body carries no data.

export const PushDeviceResponseSchema = CommonApiEnvelope(z.unknown().optional())
export type PushDeviceResponse = z.infer<typeof PushDeviceResponseSchema>
