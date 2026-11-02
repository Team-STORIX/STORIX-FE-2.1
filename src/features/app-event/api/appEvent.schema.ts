import { z } from 'zod'

export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

export const AppEventTitleEventSchema = z.object({
  id: z.number(),
  type: z.string(),
  ackRequired: z.boolean(),
  payload: z.record(z.string(), z.unknown()),
})

export const AppEventPopupSchema = z.object({
  id: z.number(),
  targetId: z.number().nullable().optional(),
  contentTargetType: z.literal('APP_EVENT'),
  exposurePolicy: z.enum(['ALWAYS_DURING_PERIOD', 'ONCE_PER_DAY']),
  popupTitle: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  displayStartAt: z.string(),
  displayEndAt: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const AppEventBannerSchema = z.object({
  id: z.number(),
  targetId: z.number().nullable().optional(),
  contentTargetType: z.literal('APP_EVENT'),
  bannerTitle: z.string(),
  imageUrl: z.string(),
  ctaText: z.string().nullable().optional(),
  exposurePolicy: z
    .enum(['ALWAYS_DURING_PERIOD', 'ONCE_PER_DAY'])
    .optional()
    .default('ALWAYS_DURING_PERIOD'),
  displayStartAt: z.string(),
  displayEndAt: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const AppEventDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  eventType: z.string(),
  pageKey: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  status: z.enum(['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELED']),
})

// CustomResponse<Void> omits `result` entirely because the backend uses
// @JsonInclude(NON_NULL), so empty-success responses must accept a missing key.
export const EmptyResultSchema = z.unknown().nullable().optional()

export const AppEventTitleEventsResponseSchema = ApiEnvelopeSchema(
  z.array(AppEventTitleEventSchema),
)

export const AppEventPopupResponseSchema = ApiEnvelopeSchema(
  AppEventPopupSchema.nullable(),
)

export const AppEventBannersResponseSchema = ApiEnvelopeSchema(
  z.array(AppEventBannerSchema),
)

export const AppEventDetailResponseSchema = ApiEnvelopeSchema(
  AppEventDetailSchema,
)

export const EmptyResultResponseSchema = ApiEnvelopeSchema(EmptyResultSchema)

export type AppEventTitleEvent = z.infer<typeof AppEventTitleEventSchema>
export type AppEventPopup = z.infer<typeof AppEventPopupSchema>
export type AppEventBanner = z.infer<typeof AppEventBannerSchema>
export type AppEventDetail = z.infer<typeof AppEventDetailSchema>
