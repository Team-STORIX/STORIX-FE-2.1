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

import { useSignup } from '../../src/hooks/auth/useSignup'
import {
  GenreKeySchema,
  type GenreKey,
  type SignupRequest,
} from '../../src/lib/api/auth/auth.schema'
import {
  checkNicknameValid,
  extractIsAvailableFromValidResponse,
  extractIsDuplicatedFromValidResponse,
  extractIsForbiddenFromValidResponse,
} from '../../src/lib/api/auth/nickname.api'
import { useAuthStore } from '../../src/store/auth.store'
import { C, Radius, S, Typography } from '../../src/theme'

const ONBOARDING_STEPS = [
  { key: 'nickname', title: 'Nickname' },
  { key: 'genres', title: 'Genres' },
  { key: 'review', title: 'Finish' },
] as const

const GENRE_OPTIONS = GenreKeySchema.options

const GENRE_LABELS: Record<GenreKey, string> = {
  ROMANCE: 'Romance',
  FANTASY: 'Fantasy',
  ROFAN: 'Romance Fantasy',
  HISTORICAL: 'Historical',
  DRAMA: 'Drama',
  THRILLER: 'Thriller',
  ACTION: 'Action',
  BL: 'BL',
  MODERN_FANTASY: 'Modern Fantasy',
  DAILY: 'Daily',
}

const MAX_NICKNAME_LENGTH = 12
const MIN_NICKNAME_LENGTH = 2

const validateNickname = (nickname: string): string | null => {
  const length = Array.from(nickname).length

  if (!nickname) return 'Enter a nickname to continue.'
  if (nickname !== nickname.trim()) {
    return 'Nickname cannot start or end with spaces.'
  }
  if (/\s/.test(nickname)) {
    return 'Nickname cannot include spaces.'
  }
  if (length < MIN_NICKNAME_LENGTH) {
    return `Nickname must be at least ${MIN_NICKNAME_LENGTH} characters.`
  }
  if (length > MAX_NICKNAME_LENGTH) {
    return `Nickname must be ${MAX_NICKNAME_LENGTH} characters or fewer.`
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
        setNicknameMessage('This nickname is available.')
        setNicknameMessageTone('success')
        return true
      }

      if (extractIsDuplicatedFromValidResponse(response)) {
        setVerifiedNickname(null)
        setNicknameMessage('This nickname is already in use.')
        setNicknameMessageTone('error')
        return false
      }

      if (extractIsForbiddenFromValidResponse(response)) {
        setVerifiedNickname(null)
        setNicknameMessage('This nickname cannot be used.')
        setNicknameMessageTone('error')
        return false
      }

      setVerifiedNickname(null)
      setNicknameMessage(
        typeof response.message === 'string' && response.message.trim().length > 0
          ? response.message
          : 'Nickname validation failed. Try again.',
      )
      setNicknameMessageTone('error')
      return false
    } catch (error) {
      setVerifiedNickname(null)
      setNicknameMessage(
        getErrorMessage(error, 'Nickname validation failed. Try again.'),
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
        setScreenError('Select at least one genre to continue.')
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
      setScreenError('Onboarding token is missing. Return to login and try again.')
      return
    }

    if (!isNicknameVerified) {
      setStep(0)
      setScreenError('Verify your nickname before signing up.')
      return
    }

    if (selectedGenres.length === 0) {
      setStep(1)
      setScreenError('Select at least one genre before signing up.')
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
      setScreenError(getErrorMessage(error, 'Signup failed. Try again.'))
    }
  }

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your nickname</Text>
          <Text style={styles.sectionBody}>
            This nickname is shown in feeds, topic rooms, and your profile.
          </Text>

          <View style={styles.inputWrap}>
            <Text style={styles.fieldLabel}>Nickname</Text>
            <TextInput
              value={nickname}
              onChangeText={handleNicknameChange}
              placeholder="Enter nickname"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={MAX_NICKNAME_LENGTH}
              style={styles.input}
              returnKeyType="done"
            />
            <Text style={styles.helperText}>
              {MIN_NICKNAME_LENGTH}-{MAX_NICKNAME_LENGTH} characters, no spaces.
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
              <Text style={styles.secondaryButtonText}>Check availability</Text>
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
          <Text style={styles.sectionTitle}>Pick your favorite genres</Text>
          <Text style={styles.sectionBody}>
            Select one or more genres for your initial reader profile.
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
            <Text style={styles.noteTitle}>Preference scope for Phase 8B</Text>
            <Text style={styles.noteBody}>
              This phase captures genre preferences only. Work-level preference
              selection and swipe onboarding remain a later phase, so signup is
              submitted with an empty favorite works list for now.
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review and finish</Text>
        <Text style={styles.sectionBody}>
          Confirm the signup data, then complete onboarding.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nickname</Text>
            <Text style={styles.summaryValue}>{trimmedNickname}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Marketing consent</Text>
            <Text style={styles.summaryValue}>
              {marketingAgree ? 'Agreed' : 'Not agreed'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Genres</Text>
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
          <Text style={styles.missingTokenTitle}>Onboarding session missing</Text>
          <Text style={styles.missingTokenBody}>
            No onboarding token was found in the auth store. Return to login and
            start the social login flow again.
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
            <Text style={styles.primaryButtonText}>Back to login</Text>
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
          <Text style={styles.eyebrow}>New user onboarding</Text>
          <Text style={styles.title}>Finish your STORIX signup</Text>
          <Text style={styles.subtitle}>
            One short flow and you will land in the main tabs.
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
              Step {step + 1} of {ONBOARDING_STEPS.length}
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
              <Text style={styles.footerSecondaryButtonText}>Back</Text>
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
                {step === 2 ? 'Complete signup' : 'Next'}
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
