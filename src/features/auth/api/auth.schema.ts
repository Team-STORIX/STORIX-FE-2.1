// src/lib/api/auth/auth.schema.ts
import { z } from 'zod'

/**
 * 공통 응답 래퍼
 * { isSuccess, code, message, result, timestamp }
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string(),
    message: z.string(),
    result: dataSchema,
    timestamp: z.string(),
  })

// ─── Genre ────────────────────────────────────────────────────────────────────

export const GenreKeySchema = z.enum([
  'ROMANCE',
  'FANTASY',
  'ROFAN',
  'HISTORICAL',
  'DRAMA',
  'THRILLER',
  'ACTION',
  'BL',
  'MODERN_FANTASY',
  'DAILY',
])
export type GenreKey = z.infer<typeof GenreKeySchema>

// ─── Login response shapes ────────────────────────────────────────────────────

export const RegularLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
})

/**
 * Native login shape: readerLoginResponse contains both accessToken and refreshToken.
 */
export const ReaderLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
})

/**
 * Pre-signup: temporary onboarding token issued before the user completes signup.
 */
export const ReaderPreLoginResponseSchema = z.object({
  onboardingToken: z.string(),
})

// ─── Social login result ──────────────────────────────────────────────────────

/**
 * Shape returned by all social login endpoints (kakao / naver / apple / x).
 * Per API spec, existing users get readerLoginResponse, new users get readerPreLoginResponse.
 * BE uses @JsonInclude(NON_NULL) so absent fields may be undefined, not null.
 */
export const SocialLoginResultSchema = z.object({
  isRegistered: z.boolean(),

  regularLoginResponse: RegularLoginResponseSchema.nullable().optional(),

  // Existing user: contains accessToken + refreshToken.
  readerLoginResponse: ReaderLoginResponseSchema.nullable().optional(),

  // New user: contains the onboardingToken for the signup flow.
  readerPreLoginResponse: ReaderPreLoginResponseSchema.nullable().optional(),
})

export const SocialLoginResponseSchema = ApiResponseSchema(SocialLoginResultSchema)

// Backward-compat alias used by hooks written against the old schema name.
export const KakaoLoginResultSchema = SocialLoginResultSchema
export const KakaoLoginResponseSchema = SocialLoginResponseSchema

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Extracts { accessToken, refreshToken } from a social login result.
 * Per API spec, both tokens are always returned together in readerLoginResponse.
 * Returns undefined if the user is not yet registered (new user flow).
 */
export const extractLoginTokens = (
  result: SocialLoginResult,
): { accessToken: string; refreshToken?: string } | undefined => {
  if (result.readerLoginResponse?.accessToken) {
    return {
      accessToken: result.readerLoginResponse.accessToken,
      refreshToken: result.readerLoginResponse.refreshToken,
    }
  }
  if (result.regularLoginResponse?.accessToken) {
    return {
      accessToken: result.regularLoginResponse.accessToken,
      refreshToken: result.regularLoginResponse.refreshToken,
    }
  }
  return undefined
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export const SignupRequestSchema = z.object({
  serviceTermsAgree: z.boolean(),
  privacyPolicyAgree: z.boolean(),
  ageOver14: z.boolean(),
  nickName: z.string().min(1),
  profileDescription: z.string(),
  favoriteGenreList: z.array(GenreKeySchema),
  favoriteWorksIdList: z.array(z.number()),
})

export const SignupResponseSchema = ApiResponseSchema(
  z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
  }),
)

// ─── Nickname check ───────────────────────────────────────────────────────────
// Note: nickname.api.ts defines its own envelope schema for the check endpoint.
// These schemas cover the result-level fields for Zod-based callers that inspect
// the result object directly.

export const NicknameValidResultSchema = z
  .object({
    isAvailable: z.boolean().optional(),
    available: z.boolean().optional(),
    canUse: z.boolean().optional(),
    isDuplicate: z.boolean().optional(),
    isDuplicated: z.boolean().optional(),
    duplicated: z.boolean().optional(),
    exists: z.boolean().optional(),
  })
  .passthrough()

export const NicknameValidEnvelopeSchema = ApiResponseSchema(
  NicknameValidResultSchema.optional().default({}),
)

export const NicknameForbiddenResultSchema = z
  .object({
    forbidden: z.boolean().optional(),
    isForbidden: z.boolean().optional(),
    blocked: z.boolean().optional(),
    message: z.string().optional(),
  })
  .passthrough()

export const NicknameForbiddenEnvelopeSchema = ApiResponseSchema(
  NicknameForbiddenResultSchema.optional().default({}),
)

// ─── Withdraw ─────────────────────────────────────────────────────────────────

export const WithdrawResponseSchema = ApiResponseSchema(z.object({}).passthrough())

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegularLoginResponse = z.infer<typeof RegularLoginResponseSchema>
export type ReaderLoginResponse = z.infer<typeof ReaderLoginResponseSchema>
export type ReaderPreLoginResponse = z.infer<typeof ReaderPreLoginResponseSchema>
export type SocialLoginResult = z.infer<typeof SocialLoginResultSchema>
export type SocialLoginResponse = z.infer<typeof SocialLoginResponseSchema>
export type KakaoLoginResult = SocialLoginResult
export type KakaoLoginResponse = SocialLoginResponse

export type SignupRequest = z.infer<typeof SignupRequestSchema>
export type SignupResponse = z.infer<typeof SignupResponseSchema>

export type NicknameValidResult = z.infer<typeof NicknameValidResultSchema>
export type NicknameForbiddenResult = z.infer<typeof NicknameForbiddenResultSchema>
export type WithdrawResponse = z.infer<typeof WithdrawResponseSchema>
