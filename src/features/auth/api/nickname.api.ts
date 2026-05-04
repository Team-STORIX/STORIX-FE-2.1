import { apiClient } from '../../../lib/api/axios-instance'
import { z } from 'zod'

/**
 * Full response envelope for the nickname validity check endpoint.
 * Uses a simple schema (code-based discrimination) rather than the result-field
 * schema in auth.schema.ts — the two are intentionally separate.
 */
export const NicknameValidResponseSchema = z.object({
  isSuccess: z.boolean(),
  code: z.string(),
  message: z.string(),
  result: z.unknown().optional(),
  timestamp: z.string(),
})

export type NicknameValidResponse = z.infer<typeof NicknameValidResponseSchema>

/**
 * Checks whether a nickname is available.
 * GET /api/v1/auth/nickname/valid?nickname=...
 *
 * validateStatus covers 4xx so callers receive a structured response instead
 * of a thrown AxiosError for "duplicate" / "forbidden" codes.
 */
export const checkNicknameValid = async (
  nickname: string,
): Promise<NicknameValidResponse> => {
  const response = await apiClient.get('/api/v1/auth/nickname/valid', {
    params: { nickname },
    validateStatus: (status) => status >= 200 && status < 500,
  })
  return NicknameValidResponseSchema.parse(response.data)
}

// ─── Response code helpers ────────────────────────────────────────────────────

/** Returns true when the nickname is available for use. */
export const extractIsAvailableFromValidResponse = (
  data: NicknameValidResponse,
): boolean => {
  if (data.isSuccess !== true) return false
  return (
    data.code === 'NICKNAME_SUCCESS_001' || // onboarding flow
    data.code === 'PROFILE_SUCCESS_002' // profile edit flow
  )
}

/** Returns true when the nickname is already taken. */
export const extractIsDuplicatedFromValidResponse = (
  data: NicknameValidResponse,
): boolean =>
  data.isSuccess === false &&
  (data.code === 'NICKNAME_ERROR_001' || data.code === 'NICKNAME_ERROR_002')

/** Returns true when the nickname matches a writer's reserved name. */
export const extractIsForbiddenFromValidResponse = (
  data: NicknameValidResponse,
): boolean => data.isSuccess === false && data.code === 'NICKNAME_ERROR_003'
