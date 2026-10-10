import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { useAuthStore } from '../../../store/auth.store'
import { useAndroidBackHandler } from '../../../lib/navigation/useAndroidBackHandler'
import { useCompleteSignup } from '../hooks/useCompleteSignup'
import { useOnboardingForm } from '../hooks/useOnboardingForm'
import { useOnboardingWorks } from '../hooks/useOnboardingWorks'
import { ONBOARDING_PROGRESS_STEPS, ONBOARDING_STEP } from '../lib/constants'
import { NicknameStep } from './NicknameStep'
import { BioStep } from './BioStep'
import { GenreStep } from './GenreStep'
import { FavoriteStep } from './FavoriteStep'
import { FinalStep } from './FinalStep'
import { FooterFadeGradient } from './FooterFadeGradient'
import { OnboardingCtaButton } from './OnboardingCtaButton'
import { OnboardingMissingScreen } from './OnboardingMissingScreen'
import { OnboardingTopBar } from './OnboardingTopBar'
import { C, Gray } from '../../../theme'

export function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const serviceTermsAgree = useAuthStore((s) => s.serviceTermsAgree)
  const privacyPolicyAgree = useAuthStore((s) => s.privacyPolicyAgree)
  const ageOver14 = useAuthStore((s) => s.ageOver14)
  const form = useOnboardingForm()
  const onboardingWorksQuery = useOnboardingWorks(!!onboardingToken)
  const { completeSignup, isCompleting } = useCompleteSignup()
  const [error, setError] = useState('')
  const footerBottomPadding = Platform.OS === 'android' ? insets.bottom + 24 : 24

  const { step, isFirstStep, isFinalStep, canProceed, goBack, goNext } = form

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      router.replace('/(auth)/agreement')
    } else {
      goBack()
    }
    return true
  }, [goBack, isFirstStep, router])

  useAndroidBackHandler(handleBack)

  const handleNext = async () => {
    if (isCompleting) return

    setError('')

    if (!onboardingToken) {
      setError('온보딩 토큰이 없어요. 로그인부터 다시 진행해 주세요.')
      return
    }

    if (step === ONBOARDING_STEP.NICKNAME && !form.nickname.verified) {
      setError('닉네임 중복 확인을 완료해 주세요.')
      return
    }

    if (step === ONBOARDING_STEP.GENRE && form.genres.length === 0) {
      setError('장르를 하나 이상 선택해 주세요.')
      return
    }

    if (!isFinalStep) {
      goNext()
      return
    }

    try {
      await completeSignup({
        request: {
          serviceTermsAgree,
          privacyPolicyAgree,
          ageOver14,
          nickName: form.nickname.value.trim(),
          profileDescription: form.bio,
          favoriteGenreList: form.genres,
          favoriteWorksIdList: form.favoriteIds,
        },
        profileImageUri: form.profileImageUri,
      })
      router.replace('/(auth)/manual')
    } catch {
      setError('회원가입에 실패했어요. 다시 시도해 주세요.')
    }
  }

  if (!onboardingToken) {
    return <OnboardingMissingScreen title="온보딩 정보가 없어요." />
  }

  const isFavoriteStep = step === ONBOARDING_STEP.FAVORITE

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <OnboardingTopBar onBack={handleBack} onSkip={isFavoriteStep ? goNext : undefined} />

        {step <= ONBOARDING_PROGRESS_STEPS ? (
          <View style={styles.progressWrap}>
            {Array.from({ length: ONBOARDING_PROGRESS_STEPS }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === step - 1 ? styles.progressDotActive : styles.progressDotInactive,
                ]}
              />
            ))}
          </View>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: footerBottomPadding + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === ONBOARDING_STEP.NICKNAME ? (
            <NicknameStep
              nickname={form.nickname}
              onNicknameChange={form.patchNickname}
              profileImageUri={form.profileImageUri}
              onProfileImageChange={form.setProfileImageUri}
            />
          ) : null}
          {step === ONBOARDING_STEP.BIO ? <BioStep value={form.bio} onChange={form.setBio} /> : null}
          {step === ONBOARDING_STEP.GENRE ? <GenreStep value={form.genres} onChange={form.setGenres} /> : null}
          {isFavoriteStep ? (
            <FavoriteStep
              works={onboardingWorksQuery.data ?? []}
              selectedIds={form.favoriteIds}
              onToggle={form.toggleFavorite}
              loading={onboardingWorksQuery.isLoading}
            />
          ) : null}
          {isFinalStep ? <FinalStep /> : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        {isFavoriteStep ? <FooterFadeGradient height={footerBottomPadding + 82} gradientId="fade" /> : null}

        <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
          <OnboardingCtaButton
            label="다음으로"
            active={canProceed}
            disabled={!canProceed || isCompleting}
            onPress={() => void handleNext()}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  scroll: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    height: 8,
    borderRadius: 2,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: C.primary,
  },
  progressDotInactive: {
    width: 8,
    backgroundColor: Gray[200],
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 2,
  },
  errorText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: C.error,
  },
})
