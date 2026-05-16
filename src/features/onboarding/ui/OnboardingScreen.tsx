import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
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

const progress1 = require('../../../../assets/onboarding/progress-indicater-1.svg')
const progress2 = require('../../../../assets/onboarding/progress-indicater-2.svg')
const progress3 = require('../../../../assets/onboarding/progress-indicater-3.svg')
const progress4 = require('../../../../assets/onboarding/progress-indicater-4.svg')
const nextPink = require('../../../../assets/onboarding/next.svg')
const nextGray = require('../../../../assets/onboarding/next-gray.svg')

const progressAssets = [progress1, progress2, progress3, progress4] as const
const genreOptions = GenreKeySchema.options

export function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const marketingAgree = useAuthStore((s) => s.marketingAgree)
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
        marketingAgree,
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
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <OnboardingTopBar onBack={handleBack} onSkip={step === 4 ? handleSkip : undefined} />

        {step <= 4 ? (
          <View style={styles.progressWrap}>
            <Image source={progressAssets[step - 1]} style={styles.progressImage} contentFit="contain" />
          </View>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 134 },
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

        <View style={[styles.footer, { paddingBottom: insets.bottom + 34 }]}>
          <Pressable
            onPress={() => void handleNext()}
            disabled={!canProceed() || signupMutation.isPending}
            style={styles.nextPressable}
          >
            <Image
              source={canProceed() ? nextPink : nextGray}
              style={styles.nextImage}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  progressWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  progressImage: {
    height: 8,
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  nextPressable: {
    width: '100%',
  },
  nextImage: {
    width: '100%',
    height: 50,
  },
  errorText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: '#EF433E',
  },
  missingScreen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: '#000000',
  },
  missingBody: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#847B7F',
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    width: 200,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FF4093',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: '#ffffff',
  },
})
