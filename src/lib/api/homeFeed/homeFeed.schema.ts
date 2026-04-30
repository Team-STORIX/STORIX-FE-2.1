// src/lib/api/homeFeed/homeFeed.schema.ts
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

/**   오늘의 피드 item */
export const FeedProfileSchema = z.object({
  userId: z.number(),
  profileImageUrl: z.string().nullish(),
  nickName: z.string(),
})

export const FeedBoardSchema = z.object({
  userId: z.number(),
  boardId: z.number(),

  isWorksSelected: z.boolean().nullish(),
  worksId: z.number().nullish(),
  lastCreatedTime: z.string().nullish(),

  content: z.string(),
  likeCount: z.number(),
  replyCount: z.number(),
  isSpoiler: z.boolean(),
  isLiked: z.boolean(),
})

export const TodayFeedItemSchema = z.object({
  profile: FeedProfileSchema,
  board: FeedBoardSchema,
})

export type TodayFeedItem = z.infer<typeof TodayFeedItemSchema>

/**   GET /api/v1/home/feeds/today 응답 */
export const TodayFeedEnvelopeSchema = ApiEnvelopeSchema(
  z.array(TodayFeedItemSchema),
)
export type TodayFeedEnvelope = z.infer<typeof TodayFeedEnvelopeSchema>
