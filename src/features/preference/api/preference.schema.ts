// src/features/preference/api/preference.schema.ts
import { z } from 'zod'
// Relative path: @/ alias differs between 2.0 (./src/*) and 2.1 (./*).
import { GenreKeySchema } from '../../auth/api/auth.schema'

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

const PreferenceExplorationItemsSchema = z.array(
  PreferenceExplorationWorkSchema,
)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const pickExplorationArray = (raw: unknown): unknown[] | undefined => {
  if (Array.isArray(raw)) return raw
  if (!isRecord(raw)) return undefined

  const result = raw.result
  if (Array.isArray(result)) return result
  if (isRecord(result)) {
    if (Array.isArray(result.content)) return result.content
    if (Array.isArray(result.result)) return result.result
    if (Array.isArray(result.works)) return result.works
  }

  if (Array.isArray(raw.content)) return raw.content
  if (Array.isArray(raw.works)) return raw.works

  return undefined
}

export class PreferenceExplorationShapeError extends Error {
  constructor() {
    super('Preference exploration response did not contain a known item array.')
    this.name = 'PreferenceExplorationShapeError'
  }
}

export const normalizePreferenceExploration = (
  raw: unknown,
): PreferenceExplorationWork[] => {
  const items = pickExplorationArray(raw)
  if (!items) throw new PreferenceExplorationShapeError()
  return PreferenceExplorationItemsSchema.parse(items)
}

export const PreferenceExplorationResponseSchema = z
  .unknown()
  .transform((raw, ctx) => {
    try {
      const envelope = isRecord(raw) ? raw : {}
      return {
        isSuccess:
          typeof envelope.isSuccess === 'boolean' ? envelope.isSuccess : true,
        code: typeof envelope.code === 'string' ? envelope.code : undefined,
        message:
          typeof envelope.message === 'string' ? envelope.message : undefined,
        timestamp:
          typeof envelope.timestamp === 'string'
            ? envelope.timestamp
            : undefined,
        result: normalizePreferenceExploration(raw),
      }
    } catch {
      ctx.addIssue({
        code: 'custom',
        message:
          'Preference exploration response did not contain a known item array.',
      })
      return z.NEVER
    }
  })

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
