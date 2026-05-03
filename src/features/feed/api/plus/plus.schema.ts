// src/api/plus/plus.schema.ts
import { z } from 'zod'

/** 공통 응답 래퍼 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string(),
    message: z.string(),
    result,
    timestamp: z.string().optional(),
  })

export const ApiEnvelopeSchema = createApiResponseSchema

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

/**   리뷰 등록 */
export const ReaderReviewCreateRequestSchema = z.object({
  worksId: z.number(),
  rating: z.union([z.string(), z.number()]).transform(String),
  isSpoiler: z.boolean(),
  spoilerScript: z.string(),
  content: z.string(),
})

export const ReaderReviewCreateResultSchema = z.object({
  worksId: z.number(),
  userId: z.number(),
  reviewId: z.number(),
})

export const ReaderReviewCreateResponseSchema = createApiResponseSchema(
  ReaderReviewCreateResultSchema,
)

/**   게시글 등록 */
export const ReaderBoardCreateRequestSchema = z.object({
  isWorksSelected: z.boolean(),
  worksId: z.number(),
  isSpoiler: z.boolean(),
  spoilerScript: z.string(),
  content: z.string(),
  files: z
    .array(
      z.object({
        objectKey: z.string(),
      }),
    )
    .default([]),
})

export const ReaderBoardCreateResponseSchema = createApiResponseSchema(z.any())

/**   게시글 이미지 presigned url 발급 */
export const BoardImagePresignRequestSchema = z.object({
  files: z.array(
    z.object({
      contentType: z.string(),
    }),
  ),
})

export const BoardImagePresignResultSchema = z.array(
  z.object({
    url: z.string(),
    objectKey: z.string(),
    expiresInSeconds: z.number(),
  }),
)

export const BoardImagePresignResponseSchema = createApiResponseSchema(
  BoardImagePresignResultSchema,
)

/**   작품 검색 (플러스 글쓰기/리뷰 작성용) */
export const PlusWorksSearchItemSchema = z.object({
  worksId: z.number(),
  worksName: z.string().optional(),
  artistName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  worksType: z.string().optional(),
  platform: z.string().optional(),
  genre: z.string().optional(),
})

export const PlusWorksSearchResultSchema = SliceSchema(
  PlusWorksSearchItemSchema,
)

export const PlusWorksSearchResponseSchema = z.preprocess((raw) => {
  if (raw && typeof raw === 'object') {
    const r = (raw as any).result
    if (r && typeof r === 'object' && (r as any).result) {
      return { ...(raw as any), result: (r as any).result }
    }
  }
  return raw
}, ApiEnvelopeSchema(PlusWorksSearchResultSchema))

/**   리뷰 중복 여부 조회 */
export const PlusReviewDuplicateResultSchema = z.preprocess(
  (v) => {
    const isDuplicated =
      typeof v === 'boolean'
        ? v
        : ((v as any)?.isDuplicated ??
          (v as any)?.duplicated ??
          (v as any)?.exists ??
          false)

    return { isDuplicated }
  },
  z.object({ isDuplicated: z.boolean() }),
)

export const PlusReviewDuplicateResponseSchema = z.preprocess((raw) => {
  if (raw && typeof raw === 'object') {
    const r: any = raw

    if (r.result === undefined) {
      if (r.isSuccess === false && r.code === 'PLUS_ERROR_004') {
        return { ...r, result: true }
      }
      return { ...r, result: false }
    }

    if (
      r.result &&
      typeof r.result === 'object' &&
      r.result.result !== undefined
    ) {
      return { ...r, result: r.result.result }
    }
  }
  return raw
}, ApiEnvelopeSchema(PlusReviewDuplicateResultSchema))

export type ReaderReviewCreateRequest = z.infer<
  typeof ReaderReviewCreateRequestSchema
>
export type ReaderBoardCreateRequest = z.infer<
  typeof ReaderBoardCreateRequestSchema
>
export type BoardImagePresignRequest = z.infer<
  typeof BoardImagePresignRequestSchema
>

export type PlusWorksSearchItem = z.infer<typeof PlusWorksSearchItemSchema>
export type PlusWorksSearchResponse = z.infer<
  typeof PlusWorksSearchResponseSchema
>
export type PlusReviewDuplicateResponse = z.infer<
  typeof PlusReviewDuplicateResponseSchema
>

export type PlusReviewDuplicateResult = z.infer<
  typeof PlusReviewDuplicateResultSchema
>
