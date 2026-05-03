// src/features/library/api/library.schema.ts
import { z } from 'zod'

/** 공통 API 래퍼(서버가 isSuccess/code/message/result/timestamp 형태로 주는 경우) */
export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

/** Spring Slice/Page 비슷한 형태(현재 네 프로젝트에서 slice로 쓰는 패턴) */
export const SliceSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    number: z.number().optional(),
    size: z.number().optional(),
    numberOfElements: z.number().optional(),
    last: z.boolean().optional(),
    empty: z.boolean().optional(),
    pageable: z.any().optional(),
    sort: z.any().optional(),
    first: z.boolean().optional(),
  })

/** 서재 내 작품 검색(무한스크롤) 아이템 */
export const LibrarySearchWorkSchema = z.object({
  worksId: z.number(),
  worksName: z.string().optional(),
  artistName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  worksType: z.string().optional(),
  genre: z.string().optional(),
  platform: z.string().optional(),

  reviewId: z.number().optional(),

  // rating이 string으로 내려올 수 있음 -> number로 변환
  rating: z.preprocess((v) => {
    if (v === null || v === undefined || v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }, z.number().optional()),
})

/** 최근 검색어 */
export const LibraryRecentKeywordsSchema = z.object({
  recentKeywords: z.array(z.string()),
})

/** 내 리뷰 작품 조회 아이템(필드는 UI에서 쓰는 최소만 안전하게) */
export const LibraryReviewItemSchema = z.object({
  worksId: z.number(),
  worksName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  worksType: z.string().optional(),
  genre: z.string().optional(),
  platform: z.string().optional(),
  avgRating: z.number().nullable().optional(),
  description: z.string().optional(),
  artistName: z.string().nullable().optional(),
  reviewId: z.number().optional(),
  rating: z.union([z.string(), z.number()]).nullable().optional(),
})

export const LibraryReviewResultSchema = z.object({
  totalReviewCount: z.number().optional(),
  result: SliceSchema(LibraryReviewItemSchema),
})
