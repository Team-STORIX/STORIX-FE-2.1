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
  contentTargetType: z.string(),
  // Optional until the backend popup contract exposes a landing URL.
  targetLink: z.string().nullable().optional(),
  exposurePolicy: z.string(),
  // Text/image fields can arrive null or absent depending on how the admin
  // configured the popup; keep parsing tolerant and let the UI fall back.
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
  contentTargetType: z.string(),
  // Optional until the backend banner contract exposes a landing URL.
  targetLink: z.string().nullable().optional(),
  bannerTitle: z.string(),
  imageUrl: z.string(),
  displayStartAt: z.string(),
  displayEndAt: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

export const EmptyResultResponseSchema = ApiEnvelopeSchema(EmptyResultSchema)

export type AppEventTitleEvent = z.infer<typeof AppEventTitleEventSchema>
export type AppEventPopup = z.infer<typeof AppEventPopupSchema>
export type AppEventBanner = z.infer<typeof AppEventBannerSchema>
