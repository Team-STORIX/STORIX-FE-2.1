import { z } from 'zod'

const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result: resultSchema,
    timestamp: z.string().optional(),
  })

const SliceSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content: z.array(itemSchema).default([]),
    number: z.coerce.number().default(0),
    size: z.coerce.number().default(0),
    numberOfElements: z.coerce.number().default(0),
    first: z.boolean().optional(),
    last: z.boolean().default(false),
    empty: z.boolean().default(false),
    pageable: z.any().optional(),
    sort: z.any().optional(),
  })

const unwrapResultOnce = (raw: unknown) => {
  const obj = raw as Record<string, unknown> | null
  if (!obj || typeof obj !== 'object') return raw

  const result = obj.result as Record<string, unknown> | undefined
  return {
    ...obj,
    result: result?.result ?? result,
  }
}

const ApiEnvelopeUnwrapSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.preprocess(unwrapResultOnce, ApiEnvelopeSchema(resultSchema))

export const WORKS_SORT_VALUES = ['NAME', 'RATING', 'REVIEW'] as const
export const TOPIC_ROOM_SORT_VALUES = ['DEFAULT', 'LATEST', 'ACTIVE'] as const
export const WORKS_TYPE_VALUES = ['WEBTOON', 'WEBNOVEL', 'COMIC'] as const
export const SEARCH_GENRE_VALUES = [
  'ROMANCE',
  'FANTASY',
  'DAILY',
  'ROFAN',
  'HISTORICAL',
  'DRAMA',
  'GAG',
  'THRILLER',
  'ACTION',
  'SPORTS',
  'SENTIMENTAL',
  'BL',
  'MODERN_FANTASY',
] as const

export const WorksSortSchema = z.enum(WORKS_SORT_VALUES)
export const TopicRoomSortSchema = z.enum(TOPIC_ROOM_SORT_VALUES)
export const SearchWorksTypeSchema = z.enum(WORKS_TYPE_VALUES)
export const SearchGenreSchema = z.enum(SEARCH_GENRE_VALUES)

export const WorksSearchItemSchema = z.object({
  worksId: z.coerce.number(),
  worksName: z.string(),
  artistName: z.string().default(''),
  reviewsCount: z.coerce.number().optional(),
  avgRating: z.coerce.number().default(0),
  thumbnailUrl: z.string().nullable().optional(),
  worksType: z.string().default(''),
})

export const TopicRoomSearchItemSchema = z.object({
  topicRoomId: z.coerce.number(),
  topicRoomName: z.string(),
  worksType: z.string().nullish(),
  worksName: z.string(),
  thumbnailUrl: z.string().nullish(),
  activeUserNumber: z.coerce.number().nullish(),
  lastChatTime: z.string().nullish(),
  isJoined: z.boolean().nullish(),
})

export const TrendingKeywordSchema = z.object({
  keyword: z.string(),
  rank: z.coerce.number(),
  status: z.string().optional(),
})

export const WorksSearchRawResponseSchema = ApiEnvelopeSchema(
  z.object({
    result: SliceSchema(WorksSearchItemSchema),
    fallbackRecommendation: z.string().nullable().optional(),
  }),
)

export const WorksSearchResponseSchema = ApiEnvelopeSchema(
  SliceSchema(WorksSearchItemSchema),
)

export const TopicRoomSearchRawResponseSchema = ApiEnvelopeSchema(
  z.object({
    result: SliceSchema(TopicRoomSearchItemSchema),
  }),
)

export const TopicRoomSearchResponseSchema = ApiEnvelopeSchema(
  SliceSchema(TopicRoomSearchItemSchema),
)

export const TrendingResponseSchema = ApiEnvelopeUnwrapSchema(
  z.object({
    trendingKeywords: z.array(TrendingKeywordSchema).default([]),
  }),
)

export const RecentResponseSchema = ApiEnvelopeUnwrapSchema(
  z.object({
    recentKeywords: z.array(z.string()).default([]),
  }),
)

export const DeleteRecentResponseSchema = ApiEnvelopeUnwrapSchema(z.any())

export type WorksSort = z.infer<typeof WorksSortSchema>
export type TopicRoomSort = z.infer<typeof TopicRoomSortSchema>
export type SearchWorksType = z.infer<typeof SearchWorksTypeSchema>
export type SearchGenre = z.infer<typeof SearchGenreSchema>
export type WorksSearchItem = z.infer<typeof WorksSearchItemSchema>
export type TopicRoomSearchItem = z.infer<typeof TopicRoomSearchItemSchema>
export type TrendingKeyword = z.infer<typeof TrendingKeywordSchema>
