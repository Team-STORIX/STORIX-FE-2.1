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
  targetId: z.number(),
  contentTargetType: z.string(),
  exposurePolicy: z.string(),
  popupTitle: z.string(),
  imageUrl: z.string(),
  content: z.string(),
  ctaText: z.string(),
  displayStartAt: z.string(),
  displayEndAt: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const AppEventBannerSchema = z.object({
  id: z.number(),
  targetId: z.number(),
  contentTargetType: z.string(),
  bannerTitle: z.string(),
  imageUrl: z.string(),
  displayStartAt: z.string(),
  displayEndAt: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const EmptyResultSchema = z.record(z.string(), z.unknown())

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
