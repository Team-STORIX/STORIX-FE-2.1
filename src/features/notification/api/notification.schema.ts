import { z } from 'zod'

/**
 * Common API envelope (isSuccess/code/message/result/timestamp).
 * Mirrors the shape used elsewhere (works.schema.ts) but kept local so the
 * notification feature stays self-contained.
 */
export const CommonApiEnvelope = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

/** Spring Slice/Page structure used for the notification list. */
export const SliceSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    number: z.number().optional(),
    size: z.number().optional(),
    numberOfElements: z.number().optional(),
    last: z.boolean().optional(),
    first: z.boolean().optional(),
    empty: z.boolean().optional(),
    pageable: z.any().optional(),
    sort: z.any().optional(),
  })

// ---------- enums (typed but extensible) ----------
// Known backend values are listed for editor hints, but a free-form fallback
// keeps parsing tolerant when the backend introduces new notification kinds.

const ExtensibleEnum = (known: readonly [string, ...string[]]) =>
  z.union([z.enum(known), z.string()])

export const KNOWN_NOTIFICATION_TYPES = ['LIKE_FEED'] as const
export const KNOWN_CATEGORIES = ['FEED'] as const
export const KNOWN_TARGET_TYPES = ['FEED'] as const

export const NotificationTypeSchema = ExtensibleEnum(KNOWN_NOTIFICATION_TYPES)
export const CategorySchema = ExtensibleEnum(KNOWN_CATEGORIES)
export const TargetTypeSchema = ExtensibleEnum(KNOWN_TARGET_TYPES)

// ---------- marketing consent ----------

export const MarketingConsentResultSchema = z.object({
  title: z.string().nullable().optional(),
  sender: z.string().nullable().optional(),
  processedAt: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const MarketingConsentResponseSchema = CommonApiEnvelope(
  MarketingConsentResultSchema,
)

// ---------- notification list item / page ----------

export const NotificationItemSchema = z.object({
  id: z.number(),
  notificationType: NotificationTypeSchema,
  category: CategorySchema,
  targetType: TargetTypeSchema,
  targetId: z.number().nullable().optional(),
  parentTargetId: z.number().nullable().optional(),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  read: z.boolean().optional(),
})

export const NotificationPageSchema = SliceSchema(NotificationItemSchema)

export const NotificationPageResponseSchema = CommonApiEnvelope(
  NotificationPageSchema,
)

// ---------- settings ----------

export const NotificationSettingsSchema = z.object({
  myActivityEnabled: z.boolean(),
  contentCommunityEnabled: z.boolean(),
  eventBenefitEnabled: z.boolean(),
  operationPolicyEnabled: z.boolean(),
})

export const NotificationSettingsResponseSchema = CommonApiEnvelope(
  NotificationSettingsSchema,
)

// ---------- unread count ----------

export const UnreadCountResponseSchema = CommonApiEnvelope(z.number())

// ---------- admin test endpoints ----------

export const AdminTestPushResponseSchema = CommonApiEnvelope(
  z.string().nullable().optional(),
)

export const AdminTestDispatchResponseSchema = CommonApiEnvelope(
  z.unknown().optional(),
)

// ---------- inferred types ----------

export type MarketingConsentResult = z.infer<typeof MarketingConsentResultSchema>
export type NotificationItem = z.infer<typeof NotificationItemSchema>
export type NotificationPage = z.infer<typeof NotificationPageSchema>
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>

export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type NotificationCategory = z.infer<typeof CategorySchema>
export type NotificationTargetType = z.infer<typeof TargetTypeSchema>

// ---------- request payloads ----------

export type AdminTestPushPayload = {
  token: string
  title: string
  body: string
}

export type AdminTestDispatchPayload = {
  recipientUserId: number
  type: NotificationType
  targetType: NotificationTargetType
  targetId: number
  parentTargetId?: number | null
  title: string
  content: string
}

/**
 * PATCH request body — partial update. Only the changed field(s) are sent.
 * eventBenefitEnabled is intentionally excluded: it is controlled by the
 * marketing-consent flow (PUT /notifications/marketing-consent), not here.
 */
export type UpdateNotificationSettingsPayload = {
  myActivityEnabled?: boolean
  contentCommunityEnabled?: boolean
  operationPolicyEnabled?: boolean
}
