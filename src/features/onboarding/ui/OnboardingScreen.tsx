import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSignup } from '../../auth/hooks/useSignup'
import { GenreKeySchema, type GenreKey } from '../../auth/api/auth.schema'
import { useAuthStore } from '../../../store/auth.store'
import { getOnboardingWorks } from '../api/onboarding.api'
import { uploadAndSetProfileImage } from '../../profile/api/profile.api'
import { NicknameStep } from './NicknameStep'
import { BioStep } from './BioStep'
import { GenreStep } from './GenreStep'
import { FavoriteStep } from './FavoriteStep'
import { FinalStep } from './FinalStep'
import { OnboardingTopBar } from './OnboardingTopBar'
import { C, Gray, Radius, Typography } from '../../../theme'

const genreOptions = GenreKeySchema.options
const ONBOARDING_PROGRESS_STEPS = 4

export function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const termsAgree = useAuthStore((s) => s.termsAgree)
  const signupMutation = useSignup()
  const onboardingWorksQuery = useQuery({
    queryKey: ['onboarding', 'works'],
    queryFn: getOnboardingWorks,
    enabled: !!onboardingToken,
    staleTime: 0,
  })

  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [nicknameVerified, setNicknameVerified] = useState(false)
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'ok' | 'taken' | 'invalid' | 'forbidden'>('idle')
  const [nicknameMessage, setNicknameMessage] = useState('')
  const [bio, setBio] = useState('')
  const [genres, setGenres] = useState<GenreKey[]>([])
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>()
  const [error, setError] = useState('')
  const footerBottomPadding = Platform.OS === 'android' ? insets.bottom + 24 : 24

  const handleBack = () => {
    if (step > 1) setStep((current) => current - 1)
    else router.push('/(auth)/agreement')
  }

  const handleSkip = () => {
    if (step < 5) setStep((current) => current + 1)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return nicknameVerified
      case 2:
        return true
      case 3:
        return genres.length >= 1
      case 4:
        return favoriteIds.length <= 18
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = async () => {
    setError('')

    if (!onboardingToken) {
      setError('온보딩 토큰이 없어요. 로그인부터 다시 진행해 주세요.')
      return
    }

    if (step === 1 && !nicknameVerified) {
      setError('닉네임 중복 확인을 완료해 주세요.')
      return
    }

    if (step === 3 && genres.length === 0) {
      setError('장르를 하나 이상 선택해 주세요.')
      return
    }

    if (step < 5) {
      setStep((current) => current + 1)
      return
    }

    try {
      await signupMutation.mutateAsync({
        marketingAgree: termsAgree,
        nickName: nickname.trim(),
        favoriteGenreList: genres,
        favoriteWorksIdList: favoriteIds,
        profileDescription: bio,
      })
      if (profileImageUri) {
        await uploadAndSetProfileImage(profileImageUri).catch(() => {})
      }
      router.replace('/(tabs)')
    } catch {
      setError('회원가입에 실패했어요. 다시 시도해 주세요.')
    }
  }

  if (!onboardingToken) {
    return (
      <View style={[styles.missingScreen, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.missingTitle}>온보딩 정보가 없어요.</Text>
        <Text style={styles.missingBody}>로그인 화면으로 돌아가 다시 진행해 주세요.</Text>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={styles.resetButton}
        >
          <Text style={styles.resetButtonText}>로그인으로 돌아가기</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <OnboardingTopBar onBack={handleBack} onSkip={step === 4 ? handleSkip : undefined} />

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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: footerBottomPadding + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <NicknameStep
              value={nickname}
              onChange={setNickname}
              verified={nicknameVerified}
              onVerifiedChange={setNicknameVerified}
              status={nicknameStatus}
              onStatusChange={setNicknameStatus}
              message={nicknameMessage}
              onMessageChange={setNicknameMessage}
              profileImageUri={profileImageUri}
              onProfileImageChange={setProfileImageUri}
            />
          ) : null}

          {step === 2 ? <BioStep value={bio} onChange={setBio} /> : null}
          {step === 3 ? <GenreStep value={genres} onChange={setGenres} /> : null}
          {step === 4 ? (
            <FavoriteStep
              works={onboardingWorksQuery.data ?? []}
              selectedIds={favoriteIds}
              onToggle={(id) =>
                setFavoriteIds((current) =>
                  current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
                )
              }
              loading={onboardingWorksQuery.isLoading}
            />
          ) : null}
          {step === 5 ? <FinalStep /> : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        {step === 4 ? (
          <View pointerEvents="none" style={[styles.footerGradient, { height: footerBottomPadding + 82 }]}>
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <SvgLinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={C.card} stopOpacity="0" />
                  <Stop offset="0.4257" stopColor={C.card} stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#fade)" />
            </Svg>
          </View>
        ) : null}

        <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
          <Pressable
            onPress={() => void handleNext()}
            disabled={!canProceed() || signupMutation.isPending}
            style={[
              styles.nextButton,
              canProceed() ? styles.nextButtonActive : styles.nextButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.nextButtonText,
                canProceed() ? styles.nextButtonTextActive : styles.nextButtonTextInactive,
              ]}
            >
              {'\ub2e4\uc74c\uc73c\ub85c'}
            </Text>
          </Pressable>
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
  footerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  nextButton: {
    width: '100%',
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonActive: {
    backgroundColor: C.text,
  },
  nextButtonInactive: {
    backgroundColor: Gray[200],
  },
  nextButtonText: {
    ...Typography.body1Medium,
  },
  nextButtonTextActive: {
    color: C.card,
  },
  nextButtonTextInactive: {
    color: Gray[500],
  },
  errorText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: C.error,
  },
  missingScreen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: C.text,
  },
  missingBody: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: Gray[500],
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    width: 200,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: C.card,
  },
})
