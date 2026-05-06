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
 *
 * Backend item shape (confirmed from live response):
 *   { worksId, worksName, thumbnailUrl, artistName, platforms[],
 *     genre, worksType, description, hashtags[] }
 *
 * The preprocess step normalizes legacy aliases that may still appear from
 * older endpoints — `platform` (string) → `platforms` (string[]),
 * `author` / `authorName` → `artistName`, `type` → `worksType`.
 * -------------------------------- */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const normalizeExplorationItem = (raw: unknown): unknown => {
  if (!isRecord(raw)) return raw

  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms.filter((p) => typeof p === 'string')
    : typeof raw.platform === 'string' && raw.platform.length > 0
      ? [raw.platform]
      : []

  const artistName =
    typeof raw.artistName === 'string' && raw.artistName.length > 0
      ? raw.artistName
      : typeof raw.author === 'string'
        ? raw.author
        : typeof raw.authorName === 'string'
          ? raw.authorName
          : ''

  const worksType =
    typeof raw.worksType === 'string' && raw.worksType.length > 0
      ? raw.worksType
      : typeof raw.type === 'string'
        ? raw.type
        : ''

  return { ...raw, platforms, artistName, worksType }
}

export const PreferenceExplorationWorkSchema = z.preprocess(
  normalizeExplorationItem,
  z.object({
    worksId: z.coerce.number(),
    worksName: z.string(),
    thumbnailUrl: z.string().nullable().optional(),
    artistName: z.string().default(''),
    platforms: z.array(z.string()).default([]),
    genre: z.string().default(''),
    worksType: z.string().default(''),
    description: z.string().default(''),
    hashtags: z.array(z.string()).default([]),
  }),
)

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

  // Daily-limit/no-content case where the backend returns `result: null`.
  if (result === null) return []

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

  // Per-item safeParse — a single malformed item must not blow up the list.
  // Items missing required worksId/worksName are dropped silently.
  const parsed: PreferenceExplorationWork[] = []
  for (const item of items) {
    const result = PreferenceExplorationWorkSchema.safeParse(item)
    if (result.success) parsed.push(result.data)
  }
  return parsed
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
