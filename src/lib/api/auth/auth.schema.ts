// src/api/auth/auth.schema.ts
import { z } from 'zod'

/**
 * 공통 응답 래퍼
 * {
 *   isSuccess: boolean,
 *   code: string,
 *   message: string,
 *   result: T,
 *   timestamp: string
 * }
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string(),
    message: z.string(),
    result: dataSchema,
    timestamp: z.string(),
  })

/**
 *   백엔드 ENUM 값(전송용) - 단일 소스
 */
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

/**
 * 로그인 성공 응답 (토큰)
 * refreshToken은 쿠키로 오므로 body에서 제거
 */
export const ReaderLoginResponseSchema = z.object({
  accessToken: z.string(),
})

/**
 * 회원가입 필요 응답 (온보딩 토큰)
 */
export const ReaderPreLoginResponseSchema = z.object({
  onboardingToken: z.string(),
})

/**
 * 카카오 로그인 결과
 * BE가 @JsonInclude(NON_NULL) 로 null 필드를 응답에서 생략하므로
 * null 뿐 아니라 undefined 도 허용해야 함.
 */
export const KakaoLoginResultSchema = z.object({
  isRegistered: z.boolean(),
  readerLoginResponse: ReaderLoginResponseSchema.nullable().optional(),
  readerPreLoginResponse: ReaderPreLoginResponseSchema.nullable().optional(),
})

/**
 * 카카오 로그인 최종 응답
 */
export const KakaoLoginResponseSchema = ApiResponseSchema(
  KakaoLoginResultSchema,
)

/**
 * 소셜 로그인 공통 응답 (kakao/naver/apple 모두 동일한 shape)
 * — 네이티브 엔드포인트도 동일 스키마를 재사용.
 */
export const SocialLoginResultSchema = KakaoLoginResultSchema
export const SocialLoginResponseSchema = ApiResponseSchema(
  SocialLoginResultSchema,
)

/**
 * 회원가입 Request
 */
export const SignupRequestSchema = z.object({
  marketingAgree: z.boolean(),
  nickName: z.string().min(1),
  //   (개선) 아무 문자열이 아니라, 백엔드 ENUM만 허용
  favoriteGenreList: z.array(GenreKeySchema),
  favoriteWorksIdList: z.array(z.number()),
  profileDescription: z.string(),
})

/**
 * 회원가입 Response
 */
export const SignupResponseSchema = ApiResponseSchema(
  z.object({
    accessToken: z.string(),
  }),
)

/**
 *   닉네임 중복 체크 Response
 */
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

export const NicknameValidResponseSchema = ApiResponseSchema(
  NicknameValidResultSchema.optional().default({}),
)

/**
 *   금칙어 체크 Response
 */
export const NicknameForbiddenResultSchema = z
  .object({
    forbidden: z.boolean().optional(),
    isForbidden: z.boolean().optional(),
    blocked: z.boolean().optional(),
    message: z.string().optional(),
  })
  .passthrough()

export const NicknameForbiddenResponseSchema = ApiResponseSchema(
  NicknameForbiddenResultSchema.optional().default({}),
)

//   회원 탈퇴 Response
export const WithdrawResponseSchema = ApiResponseSchema(
  z.object({}).passthrough(),
)

/**
 * 타입 추출
 */
export type ReaderLoginResponse = z.infer<typeof ReaderLoginResponseSchema>
export type ReaderPreLoginResponse = z.infer<
  typeof ReaderPreLoginResponseSchema
>
export type KakaoLoginResult = z.infer<typeof KakaoLoginResultSchema>
export type KakaoLoginResponse = z.infer<typeof KakaoLoginResponseSchema>
export type SocialLoginResult = z.infer<typeof SocialLoginResultSchema>
export type SocialLoginResponse = z.infer<typeof SocialLoginResponseSchema>

export type SignupRequest = z.infer<typeof SignupRequestSchema>
export type SignupResponse = z.infer<typeof SignupResponseSchema>

export type NicknameValidResponse = z.infer<typeof NicknameValidResponseSchema>
export type NicknameForbiddenResponse = z.infer<
  typeof NicknameForbiddenResponseSchema
>
export type WithdrawResponse = z.infer<typeof WithdrawResponseSchema>
