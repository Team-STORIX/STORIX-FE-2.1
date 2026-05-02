// src/lib/api/hashtag/hashtag.schema.ts
import { z } from 'zod'

/**   공통 Envelope (isSuccess/code/message/result) */
export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

/**   추천 해시태그 item */
export const RecommendedHashtagSchema = z.object({
  id: z.number(),
  name: z.string(),
  count: z.number(),
})

export type RecommendedHashtag = z.infer<typeof RecommendedHashtagSchema>

/**   GET /api/v1/hashtags/recommendations 응답 */
export const RecommendedHashtagEnvelopeSchema = ApiEnvelopeSchema(
  z.array(RecommendedHashtagSchema),
)
export type RecommendedHashtagEnvelope = z.infer<
  typeof RecommendedHashtagEnvelopeSchema
>
