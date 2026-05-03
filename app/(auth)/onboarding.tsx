import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  useSignup,
  GenreKeySchema,
  checkNicknameValid,
  extractIsAvailableFromValidResponse,
  extractIsDuplicatedFromValidResponse,
  extractIsForbiddenFromValidResponse,
  type GenreKey,
  type SignupRequest,
} from '../../src/features/auth'
import { useAuthStore } from '../../src/store/auth.store'
import { C, Radius, S, Typography } from '../../src/theme'

const ONBOARDING_STEPS = [
  { key: 'nickname', title: '닉네임' },
  { key: 'genres', title: '장르' },
  { key: 'review', title: '완료' },
] as const

const GENRE_OPTIONS = GenreKeySchema.options

const GENRE_LABELS: Record<GenreKey, string> = {
  ROMANCE: '로맨스',
  FANTASY: '판타지',
  ROFAN: '로판',
  HISTORICAL: '시대물',
  DRAMA: '드라마',
  THRILLER: '스릴러',
  ACTION: '액션',
  BL: 'BL',
  MODERN_FANTASY: '현대 판타지',
  DAILY: '일상',
}

const MAX_NICKNAME_LENGTH = 12
const MIN_NICKNAME_LENGTH = 2

const validateNickname = (nickname: string): string | null => {
  const length = Array.from(nickname).length

  if (!nickname) return '닉네임을 입력해 주세요.'
  if (nickname !== nickname.trim()) {
    return '닉네임 앞뒤에는 공백을 넣을 수 없어요.'
  }
  if (/\s/.test(nickname)) {
    return '닉네임에는 공백을 사용할 수 없어요.'
  }
  if (length < MIN_NICKNAME_LENGTH) {
    return `닉네임은 ${MIN_NICKNAME_LENGTH}자 이상이어야 해요.`
  }
  if (length > MAX_NICKNAME_LENGTH) {
    return `닉네임은 ${MAX_NICKNAME_LENGTH}자 이하로 입력해 주세요.`
  }
  return null
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const responseMessage = error.response?.data?.message
    if (
      typeof responseMessage === 'string' &&
      responseMessage.trim().length > 0
    ) {
      return responseMessage
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const marketingAgree = useAuthStore((s) => s.marketingAgree)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const signupMutation = useSignup()
  const nicknameCheckMutation = useMutation({
    mutationFn: (nickname: string) => checkNicknameValid(nickname),
  })

  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null)
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null)
  const [nicknameMessageTone, setNicknameMessageTone] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [selectedGenres, setSelectedGenres] = useState<GenreKey[]>([])
  const [screenError, setScreenError] = useState<string | null>(null)

  const trimmedNickname = nickname.trim()
  const isNicknameVerified = verifiedNickname === trimmedNickname
  const currentStep = ONBOARDING_STEPS[step]
  const canGoBack = step > 0

  const handleBackToLogin = async () => {
    await clearAuth()
  }

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    setScreenError(null)

    if (value.trim() !== verifiedNickname) {
      setVerifiedNickname(null)
      setNicknameMessage(null)
      setNicknameMessageTone('idle')
    }
  }

  const handleCheckNickname = async () => {
    const localError = validateNickname(trimmedNickname)
    if (localError) {
      setNicknameMessage(localError)
      setNicknameMessageTone('error')
      return false
    }

    try {
      const response = await nicknameCheckMutation.mutateAsync(trimmedNickname)

      if (extractIsAvailableFromValidResponse(response)) {
        setVerifiedNickname(trimmedNickname)
        setNicknameMessage('사용할 수 있는 닉네임이에요.')
        setNicknameMessageTone('success')
        return true
      }

      if (extractIsDuplicatedFromValidResponse(response)) {
        setVerifiedNickname(null)
        setNicknameMessage('이미 사용 중인 닉네임이에요.')
        setNicknameMessageTone('error')
        return false
      }

      if (extractIsForbiddenFromValidResponse(response)) {
        setVerifiedNickname(null)
        setNicknameMessage('사용할 수 없는 닉네임이에요.')
        setNicknameMessageTone('error')
        return false
      }

      setVerifiedNickname(null)
      setNicknameMessage(
        typeof response.message === 'string' && response.message.trim().length > 0
          ? response.message
          : '닉네임 확인에 실패했어요. 다시 시도해 주세요.',
      )
      setNicknameMessageTone('error')
      return false
    } catch (error) {
      setVerifiedNickname(null)
      setNicknameMessage(
        getErrorMessage(error, '닉네임 확인에 실패했어요. 다시 시도해 주세요.'),
      )
      setNicknameMessageTone('error')
      return false
    }
  }

  const handleNext = async () => {
    setScreenError(null)

    if (step === 0) {
      const checked = isNicknameVerified
        ? true
        : await handleCheckNickname()
      if (checked) setStep(1)
      return
    }

    if (step === 1) {
      if (selectedGenres.length === 0) {
        setScreenError('계속하려면 장르를 하나 이상 선택해 주세요.')
        return
      }
      setStep(2)
    }
  }

  const handleToggleGenre = (genre: GenreKey) => {
    setScreenError(null)
    setSelectedGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre],
    )
  }

  const handleSubmit = async () => {
    if (!onboardingToken) {
      setScreenError('온보딩 토큰이 없어요. 로그인부터 다시 진행해 주세요.')
      return
    }

    if (!isNicknameVerified) {
      setStep(0)
      setScreenError('회원가입 전에 닉네임 확인을 완료해 주세요.')
      return
    }

    if (selectedGenres.length === 0) {
      setStep(1)
      setScreenError('회원가입 전에 장르를 하나 이상 선택해 주세요.')
      return
    }

    const payload: SignupRequest = {
      marketingAgree,
      nickName: trimmedNickname,
      favoriteGenreList: selectedGenres,
      favoriteWorksIdList: [],
      profileDescription: '',
    }

    try {
      setScreenError(null)
      await signupMutation.mutateAsync(payload)
      router.replace('/(tabs)')
    } catch (error) {
      setScreenError(getErrorMessage(error, '회원가입에 실패했어요. 다시 시도해 주세요.'))
    }
  }

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>닉네임을 설정해 주세요</Text>
          <Text style={styles.sectionBody}>
            피드, 톡방, 프로필에 표시될 닉네임이에요.
          </Text>

          <View style={styles.inputWrap}>
            <Text style={styles.fieldLabel}>닉네임</Text>
            <TextInput
              value={nickname}
              onChangeText={handleNicknameChange}
              placeholder="닉네임 입력"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={MAX_NICKNAME_LENGTH}
              style={styles.input}
              returnKeyType="done"
            />
            <Text style={styles.helperText}>
              {MIN_NICKNAME_LENGTH}~{MAX_NICKNAME_LENGTH}자, 공백 없이 입력해 주세요.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              nicknameCheckMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleCheckNickname}
            disabled={nicknameCheckMutation.isPending}
            accessibilityRole="button"
          >
            {nicknameCheckMutation.isPending ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>중복 확인</Text>
            )}
          </Pressable>

          {nicknameMessage ? (
            <View
              style={[
                styles.messageBox,
                nicknameMessageTone === 'success'
                  ? styles.successBox
                  : styles.errorBox,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  nicknameMessageTone === 'success'
                    ? styles.successText
                    : styles.errorText,
                ]}
              >
                {nicknameMessage}
              </Text>
            </View>
          ) : null}
        </View>
      )
    }

    if (step === 1) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>좋아하는 장르를 골라 주세요</Text>
          <Text style={styles.sectionBody}>
            독자 프로필을 위한 선호 장르를 하나 이상 선택해 주세요.
          </Text>

          <View style={styles.genreGrid}>
            {GENRE_OPTIONS.map((genre) => {
              const selected = selectedGenres.includes(genre)

              return (
                <Pressable
                  key={genre}
                  style={({ pressed }) => [
                    styles.genreChip,
                    selected && styles.genreChipSelected,
                    pressed && styles.genreChipPressed,
                  ]}
                  onPress={() => handleToggleGenre(genre)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.genreChipText,
                      selected && styles.genreChipTextSelected,
                    ]}
                  >
                    {GENRE_LABELS[genre]}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>현재 단계 안내</Text>
            <Text style={styles.noteBody}>
              이번 단계에서는 장르 취향만 먼저 받아요. 작품 단위 취향 선택과
              스와이프 온보딩은 다음 단계에서 추가될 예정이라, 지금은 선호 작품
              목록 없이 회원가입이 진행돼요.
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>입력 내용을 확인해 주세요</Text>
        <Text style={styles.sectionBody}>
          회원가입 정보를 확인한 뒤 온보딩을 완료해 주세요.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>닉네임</Text>
            <Text style={styles.summaryValue}>{trimmedNickname}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>마케팅 수신 동의</Text>
            <Text style={styles.summaryValue}>
              {marketingAgree ? '동의함' : '동의 안 함'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>장르</Text>
            <View style={styles.summaryGenreWrap}>
              {selectedGenres.map((genre) => (
                <View key={genre} style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>{GENRE_LABELS[genre]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    )
  }

  if (!onboardingToken) {
    return (
      <View
        style={[
          styles.missingTokenContainer,
          {
            paddingTop: insets.top + S.sectionV,
            paddingBottom: insets.bottom + S.sectionV,
          },
        ]}
      >
        <View style={styles.missingTokenCard}>
          <Text style={styles.missingTokenTitle}>온보딩 정보가 없어요</Text>
          <Text style={styles.missingTokenBody}>
            인증 정보에서 온보딩 토큰을 찾지 못했어요. 로그인 화면으로 돌아가
            소셜 로그인을 다시 진행해 주세요.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              styles.primaryButtonStandalone,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleBackToLogin}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>로그인으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + S.cardPad }]}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>신규 회원 온보딩</Text>
          <Text style={styles.title}>STORIX 회원가입을 마무리해 주세요</Text>
          <Text style={styles.subtitle}>
            몇 단계만 완료하면 바로 메인 화면으로 이동할 수 있어요.
          </Text>
        </View>

        <View style={styles.progressRow}>
          {ONBOARDING_STEPS.map((item, index) => {
            const active = index === step
            const completed = index < step

            return (
              <View key={item.key} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    active && styles.progressDotActive,
                    completed && styles.progressDotCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.progressDotText,
                      active && styles.progressDotTextActive,
                      completed && styles.progressDotTextCompleted,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.progressLabel,
                    active && styles.progressLabelActive,
                  ]}
                >
                  {item.title}
                </Text>
              </View>
            )
          })}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardStepLabel}>
              {ONBOARDING_STEPS.length}단계 중 {step + 1}단계
            </Text>
            <Text style={styles.cardTitle}>{currentStep.title}</Text>
            {renderStepContent()}

            {screenError ? (
              <View style={[styles.messageBox, styles.errorBox]}>
                <Text style={[styles.messageText, styles.errorText]}>
                  {screenError}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + S.cardPad },
          ]}
        >
          {canGoBack ? (
            <Pressable
              style={({ pressed }) => [
                styles.footerSecondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => {
                setScreenError(null)
                setStep((current) => Math.max(0, current - 1))
              }}
              accessibilityRole="button"
            >
              <Text style={styles.footerSecondaryButtonText}>이전</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              (signupMutation.isPending || nicknameCheckMutation.isPending) &&
                styles.buttonDisabled,
            ]}
            onPress={step === 2 ? handleSubmit : handleNext}
            disabled={signupMutation.isPending || nicknameCheckMutation.isPending}
            accessibilityRole="button"
          >
            {signupMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step === 2 ? '회원가입 완료' : '다음'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  missingTokenContainer: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: S.screenH,
    justifyContent: 'center',
  },
  missingTokenCard: {
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.cardPad,
    gap: S.itemGap,
  },
  missingTokenTitle: {
    ...Typography.heading4,
    color: C.text,
  },
  missingTokenBody: {
    ...Typography.body2Medium,
    color: C.textSecondary,
  },
  header: {
    paddingHorizontal: S.screenH,
    paddingBottom: S.cardPad,
    gap: S.itemGap,
  },
  eyebrow: {
    ...Typography.caption1Extrabold,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  subtitle: {
    ...Typography.body2Medium,
    color: C.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: S.screenH,
    paddingBottom: S.cardPad,
    gap: S.itemGap,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
    gap: S.itemGap,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  progressDotCompleted: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  progressDotText: {
    ...Typography.caption1Extrabold,
    color: C.textMuted,
  },
  progressDotTextActive: {
    color: C.primary,
  },
  progressDotTextCompleted: {
    color: '#ffffff',
  },
  progressLabel: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: C.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: S.screenH,
    paddingBottom: S.sectionV,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.cardPad,
    gap: S.cardPad,
  },
  cardStepLabel: {
    ...Typography.caption1Extrabold,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardTitle: {
    ...Typography.heading3,
    color: C.text,
  },
  section: {
    gap: S.cardPad,
  },
  sectionTitle: {
    ...Typography.heading4,
    color: C.text,
  },
  sectionBody: {
    ...Typography.body2Medium,
    color: C.textSecondary,
  },
  inputWrap: {
    gap: S.itemGap,
  },
  fieldLabel: {
    ...Typography.body2Bold,
    color: C.text,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    borderRadius: Radius.md,
    paddingHorizontal: S.inputH,
    paddingVertical: 14,
    color: C.text,
    fontSize: 16,
  },
  helperText: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  secondaryButton: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryButton: {
    minWidth: 96,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.cardPad,
  },
  footerSecondaryButtonText: {
    ...Typography.body2Bold,
    color: C.text,
  },
  secondaryButtonPressed: {
    opacity: 0.82,
  },
  secondaryButtonText: {
    ...Typography.body2Bold,
    color: C.primary,
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.cardPad,
  },
  primaryButtonStandalone: {
    flex: 0,
    marginTop: S.itemGap,
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  primaryButtonText: {
    ...Typography.body1Bold,
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  messageBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: S.cardPad,
    paddingVertical: 12,
  },
  messageText: {
    ...Typography.body2Medium,
  },
  successBox: {
    backgroundColor: C.primaryLight,
    borderColor: C.primaryMid,
  },
  successText: {
    color: C.primary,
  },
  errorBox: {
    backgroundColor: '#fff3f3',
    borderColor: '#fecaca',
  },
  errorText: {
    color: C.error,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.full,
    backgroundColor: C.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  genreChipSelected: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  genreChipPressed: {
    opacity: 0.82,
  },
  genreChipText: {
    ...Typography.body2Bold,
    color: C.textSecondary,
  },
  genreChipTextSelected: {
    color: C.primary,
  },
  noteCard: {
    borderRadius: Radius.md,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.cardPad,
    gap: S.itemGap,
  },
  noteTitle: {
    ...Typography.body2Bold,
    color: C.text,
  },
  noteBody: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.md,
    backgroundColor: C.bg,
    padding: S.cardPad,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.itemGap,
  },
  summaryBlock: {
    gap: S.itemGap,
  },
  summaryLabel: {
    ...Typography.caption1Extrabold,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    ...Typography.body2Bold,
    color: C.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: C.divider,
  },
  summaryGenreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.itemGap,
  },
  summaryChip: {
    borderRadius: Radius.full,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryChipText: {
    ...Typography.caption1Extrabold,
    color: C.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.itemGap,
    paddingHorizontal: S.screenH,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  footerSpacer: {
    width: 96,
  },
})
