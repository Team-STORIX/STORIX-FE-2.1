// src/features/preference/api/preference.schema.ts
import { z } from 'zod'
// Relative path: @/ alias differs between 2.0 (./src/*) and 2.1 (./*).
import { GenreKeySchema } from '../../../lib/api/auth/auth.schema'

const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

/** -------------------------------
 * 1) GET /api/v1/preference/exploration
 *    취향 탐색 작품 리스트
 * -------------------------------- */
export const PreferenceExplorationWorkSchema = z
  .object({
    worksId: z.coerce.number(),
    worksName: z.string().catch(''),
    thumbnailUrl: z.string().nullable().optional(),
    worksType: z.string().catch(''),
    artistName: z.string().catch(''),
    platform: z.string().catch(''),
    genre: z.string().catch(''),
    description: z.string().catch(''),
    hashtags: z.array(z.string()).catch([]),
  })
  .passthrough()

export const PreferenceExplorationResponseSchema = z.preprocess(
  (raw) => {
    if (raw && typeof raw === 'object') {
      const r = (raw as any).result
      if (r && typeof r === 'object' && (r as any).result) {
        return { ...(raw as any), result: (r as any).result }
      }
    }
    return raw
  },
  ApiEnvelopeSchema(z.array(PreferenceExplorationWorkSchema).default([])),
)

export type PreferenceExplorationWork = z.infer<
  typeof PreferenceExplorationWorkSchema
>

/** -------------------------------
 * 2) POST /api/v1/preference/exploration
 *    작품 like/dislike 기록
 * -------------------------------- */
export const PreferenceAnalyzeRequestSchema = z.object({
  worksId: z.number(),
  isLiked: z.boolean(),
})

export type PreferenceAnalyzeRequest = z.infer<
  typeof PreferenceAnalyzeRequestSchema
>
export const PreferenceAnalyzeResponseSchema = ApiEnvelopeSchema(
  z.union([z.string(), z.null(), z.object({}).passthrough()]).optional(),
)

/** -------------------------------
 * 3) GET /api/v1/preference/stats
 *    선호 장르 통계
 * -------------------------------- */
export const PreferenceStatItemSchema = z.object({
  genre: GenreKeySchema,
  score: z.coerce.number(),
})

export const PreferenceStatsResponseSchema = ApiEnvelopeSchema(
  z.array(PreferenceStatItemSchema).default([]),
)

export type PreferenceStatItem = z.infer<typeof PreferenceStatItemSchema>

/** -------------------------------
 * 4) GET /api/v1/preference/results
 *    취향 분석 결과 (liked/disliked 작품 리스트)
 * -------------------------------- */
export const PreferenceResultWorkSchema = z
  .object({
    worksId: z.coerce.number(),
    worksName: z.string().catch(''),
    author: z.string().catch(''),
    illustrator: z.string().catch(''),
    originalAuthor: z.string().catch(''),
    thumbnailUrl: z.string().nullable().optional(),
    worksType: z.string().catch(''),
    genre: GenreKeySchema,
  })
  .passthrough()

export const PreferenceResultsSchema = z.object({
  likedWorks: z.array(PreferenceResultWorkSchema).default([]),
  dislikedWorks: z.array(PreferenceResultWorkSchema).default([]),
})

export const PreferenceResultsResponseSchema = ApiEnvelopeSchema(
  PreferenceResultsSchema,
)

export type PreferenceResultWork = z.infer<typeof PreferenceResultWorkSchema>
