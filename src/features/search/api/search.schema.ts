// src/features/search/api/search.schema.ts
import { z } from 'zod'

// 공통 응답 래퍼
const ApiResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string(),
    message: z.string(),
    result: resultSchema,
    timestamp: z.string().optional(),
  })

/** ---- works/artists 페이지 객체(실응답 기준) ---- */
const PageableSchema = z
  .object({
    pageNumber: z.coerce.number(),
    pageSize: z.coerce.number(),
    sort: z.any().optional(),
    offset: z.coerce.number(),
    unpaged: z.boolean(),
    paged: z.boolean(),
  })
  .passthrough()

const SliceSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      content: z.array(itemSchema).default([]),
      number: z.coerce.number(),
      size: z.coerce.number(),
      numberOfElements: z.coerce.number(),
      first: z.boolean(),
      last: z.boolean(),
      empty: z.boolean(),

      pageable: PageableSchema,
      sort: z.any().optional(),
    })
    .passthrough()

/** Works item */
export const WorksSearchItemSchema = z
  .object({
    worksId: z.coerce.number(),
    worksName: z.string(),
    artistName: z.string(),
    reviewsCount: z.coerce.number(),
    avgRating: z.coerce.number(),
    thumbnailUrl: z.string().nullable().optional(),
    worksType: z.string(),
  })
  .passthrough()

/**   Raw(실응답) 스키마 */
export const WorksSearchRawResponseSchema = ApiResponseSchema(
  z.object({
    result: SliceSchema(WorksSearchItemSchema),
    fallbackRecommendation: z.string().nullable().optional(),
  }),
)

/**   Normalized(기존 FE 호환) 스키마: result가 곧 Slice */
export const WorksSearchResponseSchema = ApiResponseSchema(
  SliceSchema(WorksSearchItemSchema),
)

/** ---- trending/recent ---- */
const unwrapResultOnce = (raw: unknown) => {
  const obj = raw as any
  if (!obj || typeof obj !== 'object') return raw
  return {
    ...obj,
    result: obj?.result?.result ?? obj?.result,
  }
}

const ApiResponseUnwrapSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.preprocess(unwrapResultOnce, ApiResponseSchema(dataSchema))

/** Trending */
export const TrendingKeywordSchema = z
  .object({
    keyword: z.string(),
    rank: z.coerce.number(),
    status: z.string().optional(),
  })
  .passthrough()

export const TrendingResponseSchema = ApiResponseUnwrapSchema(
  z
    .object({
      trendingKeywords: z.array(TrendingKeywordSchema).default([]),
    })
    .passthrough(),
)

/** Recent */
export const RecentResponseSchema = ApiResponseUnwrapSchema(
  z
    .object({
      recentKeywords: z.array(z.string()).default([]),
    })
    .passthrough(),
)

/** Delete recent */
export const DeleteRecentResponseSchema = ApiResponseUnwrapSchema(z.any())

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

export const SearchWorksTypeSchema = z.enum(WORKS_TYPE_VALUES)
export const SearchGenreSchema = z.enum(SEARCH_GENRE_VALUES)

export type WorksSort = 'NAME' | 'RATING' | 'REVIEW'
export type WorksSearchItem = z.infer<typeof WorksSearchItemSchema>
export type TrendingKeyword = z.infer<typeof TrendingKeywordSchema>
export type SearchWorksType = z.infer<typeof SearchWorksTypeSchema>
export type SearchGenre = z.infer<typeof SearchGenreSchema>

/** ---- /api/v2/search/topic-rooms ---- */
export const TopicRoomSearchItemSchema = z.object({
  topicRoomId: z.number(),
  topicRoomName: z.string(),
  worksType: z.string().nullish(),
  worksName: z.string(),
  thumbnailUrl: z.string().nullish(),
  activeUserNumber: z.number().nullish(),
  lastChatTime: z.string().nullish(),
  isJoined: z.boolean().nullish(),
})

export const TopicRoomSearchRawResponseSchema = ApiResponseSchema(
  z.object({
    result: SliceSchema(TopicRoomSearchItemSchema),
  }),
)

export const TopicRoomSearchResponseSchema = ApiResponseSchema(
  SliceSchema(TopicRoomSearchItemSchema),
)

export const TOPIC_ROOM_SORT_VALUES = ['DEFAULT', 'LATEST', 'ACTIVE'] as const
export type TopicRoomSort = (typeof TOPIC_ROOM_SORT_VALUES)[number]
export type TopicRoomSearchItem = z.infer<typeof TopicRoomSearchItemSchema>
