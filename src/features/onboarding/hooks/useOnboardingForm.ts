import { useCallback, useState } from 'react'
import type { GenreKey } from '../../auth/api/auth.schema'
import type { NicknameCheckStatus } from '../../auth/lib/nickname-check'
import { MAX_FAVORITE_COUNT, ONBOARDING_STEP, type OnboardingStep } from '../lib/constants'

export type NicknameState = {
  value: string
  verified: boolean
  status: NicknameCheckStatus
  message: string
}

const initialNicknameState: NicknameState = {
  value: '',
  verified: false,
  status: 'idle',
  message: '',
}

/**
 * 온보딩 입력값과 단계 이동을 한 곳에서 관리한다.
 * 단계를 오가도 입력값이 유지되도록 화면(OnboardingScreen)에서 소유한다.
 */
export function useOnboardingForm() {
  const [step, setStep] = useState<OnboardingStep>(ONBOARDING_STEP.NICKNAME)
  const [nickname, setNicknameState] = useState<NicknameState>(initialNicknameState)
  const [bio, setBio] = useState('')
  const [genres, setGenres] = useState<GenreKey[]>([])
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>()

  const patchNickname = useCallback((patch: Partial<NicknameState>) => {
    setNicknameState((current) => ({ ...current, ...patch }))
  }, [])

  const toggleFavorite = useCallback((id: number) => {
    setFavoriteIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const goNext = useCallback(() => {
    setStep((current) => (current < ONBOARDING_STEP.FINAL ? ((current + 1) as OnboardingStep) : current))
  }, [])

  const goBack = useCallback(() => {
    setStep((current) => (current > ONBOARDING_STEP.NICKNAME ? ((current - 1) as OnboardingStep) : current))
  }, [])

  const canProceed = (() => {
    switch (step) {
      case ONBOARDING_STEP.NICKNAME:
        return nickname.verified
      case ONBOARDING_STEP.GENRE:
        return genres.length >= 1
      case ONBOARDING_STEP.FAVORITE:
        return favoriteIds.length <= MAX_FAVORITE_COUNT
      case ONBOARDING_STEP.BIO:
      case ONBOARDING_STEP.FINAL:
        return true
      default:
        return false
    }
  })()

  return {
    step,
    isFirstStep: step === ONBOARDING_STEP.NICKNAME,
    isFinalStep: step === ONBOARDING_STEP.FINAL,
    canProceed,
    goNext,
    goBack,
    nickname,
    patchNickname,
    bio,
    setBio,
    genres,
    setGenres,
    favoriteIds,
    toggleFavorite,
    profileImageUri,
    setProfileImageUri,
  }
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>
