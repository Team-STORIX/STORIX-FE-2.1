/** 온보딩 단계: 1 닉네임 → 2 한 줄 소개 → 3 장르 → 4 관심 작품 → 5 완료 */
export const ONBOARDING_STEP = {
  NICKNAME: 1,
  BIO: 2,
  GENRE: 3,
  FAVORITE: 4,
  FINAL: 5,
} as const

export type OnboardingStep = (typeof ONBOARDING_STEP)[keyof typeof ONBOARDING_STEP]

/** 상단 진행 표시(점)에 포함되는 단계 수. 완료 화면은 제외한다. */
export const ONBOARDING_PROGRESS_STEPS = 4

export const BIO_MAX_LENGTH = 30
export const MAX_GENRE_COUNT = 3
export const MAX_FAVORITE_COUNT = 18

/** 관심 작품 로딩 중 보여줄 스켈레톤 카드 수 */
export const FAVORITE_SKELETON_COUNT = 18
