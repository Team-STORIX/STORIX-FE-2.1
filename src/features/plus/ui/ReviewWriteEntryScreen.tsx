import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useQueryClient } from '@tanstack/react-query'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Magenta } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'
import { useWorksDetail } from '../../works'
import { useCreateReaderReview, usePlusReviewDuplicateCheck } from '../hooks'
import { PROFILE_RATINGS_QUERY_KEY } from '../../profile/hooks/useProfileRatings'
import { RatingInput } from './RatingInput'
import { SpoilerToggleSection } from './SpoilerToggleSection'
import { WriteTargetWorkCard } from './WriteTargetWorkCard'

const backIcon = require('../../../../assets/icons/common/back.svg')

const MAX_CONTENT_LENGTH = 500
const REVIEW_DEFAULT_SPOILER = '스포일러가 포함된 리뷰 보기'

function parseWorksId(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

export function ReviewWriteEntryScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ worksId?: string }>()
  const worksId = parseWorksId(params.worksId)
  const queryClient = useQueryClient()

  const worksQuery = useWorksDetail(worksId ?? 0)
  const work = worksQuery.data
  const duplicateQuery = usePlusReviewDuplicateCheck(worksId)
  const isDuplicated = duplicateQuery.data?.result?.isDuplicated === true

  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [spoilerMessage, setSpoilerMessage] = useState('')

  const submitMutation = useCreateReaderReview()

  const content = text.trim()

  const canSubmit = useMemo(() => {
    if (!worksId) return false
    if (rating < 0.5) return false
    if (content.length === 0) return false
    if (content.length > MAX_CONTENT_LENGTH) return false
    if (submitMutation.isPending) return false
    if (isDuplicated) return false
    return true
  }, [
    content.length,
    isDuplicated,
    rating,
    submitMutation.isPending,
    worksId,
  ])

  const workMeta = useMemo(
    () =>
      [work?.author, work?.worksType].filter(Boolean).join(' · '),
    [work?.author, work?.worksType],
  )

  const onSubmit = async () => {
    if (!canSubmit || !worksId) return
    try {
      await submitMutation.mutateAsync({
        worksId,
        rating: rating.toFixed(1),
        isSpoiler: spoiler,
        spoilerScript: spoiler ? spoilerMessage.trim() : '',
        content,
      })
      queryClient.invalidateQueries({ queryKey: ['works', 'review', 'list', worksId] })
      queryClient.invalidateQueries({ queryKey: ['works', 'review', 'me', worksId] })
      queryClient.invalidateQueries({ queryKey: ['works', 'detail', worksId] })
      queryClient.invalidateQueries({ queryKey: PROFILE_RATINGS_QUERY_KEY })
      router.replace(`/works/${worksId}` as never)
    } catch (e) {
      Alert.alert(
        '리뷰 등록 실패',
        e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.',
      )
    }
  }

  const cardLoading =
    !!worksId && (worksQuery.isLoading || (!worksQuery.data && !worksQuery.isError))
  const cardError = !!worksId && worksQuery.isError

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Image source={backIcon} style={styles.headerIcon} contentFit="contain" />
        </Pressable>

        <Text style={styles.headerTitle}>리뷰</Text>

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          hitSlop={12}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && canSubmit && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="등록"
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Text
              style={[
                styles.submitText,
                canSubmit ? styles.submitTextActive : styles.submitTextDisabled,
              ]}
            >
              완료
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Work card + rating */}
        <View style={styles.workSection}>
          <WriteTargetWorkCard
            title={work?.worksName ?? '작품 제목'}
            meta={workMeta}
            thumbnailUrl={work?.thumbnailUrl ?? undefined}
            loading={cardLoading}
          >
            <RatingInput value={rating} onChange={setRating} size={36} />
          </WriteTargetWorkCard>

          {!worksId ? (
            <Text style={styles.warningText}>
              선택된 작품이 없어요. 작품을 먼저 골라 주세요.
            </Text>
          ) : cardError ? (
            <Text style={styles.warningText}>
              작품 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
            </Text>
          ) : isDuplicated ? (
            <Text style={styles.warningText}>
              이미 작성한 리뷰가 있어요. 리뷰는 작품당 하나만 작성할 수 있어요.
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionHeading}>리뷰 작성</Text>

        <View style={styles.textareaWrap}>
          <TextInput
            value={text}
            onChangeText={(next) =>
              setText(
                next.length > MAX_CONTENT_LENGTH
                  ? next.slice(0, MAX_CONTENT_LENGTH)
                  : next,
              )
            }
            maxLength={MAX_CONTENT_LENGTH}
            multiline
            textAlignVertical="top"
            placeholder="좋아하는 작품에 대해 적어보세요!"
            placeholderTextColor={C.textMuted}
            style={styles.textarea}
          />
        </View>

        <SpoilerToggleSection
          enabled={spoiler}
          onToggle={() => setSpoiler((prev) => !prev)}
          message={spoilerMessage}
          onMessageChange={setSpoilerMessage}
          defaultMessage={REVIEW_DEFAULT_SPOILER}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: C.card,
  },
  headerBtn: {
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...Typography.body1Medium,
    color: C.text,
  },
  submitText: {
    ...Typography.body1Medium,
  },
  submitTextActive: {
    color: Magenta[500],
  },
  submitTextDisabled: {
    color: C.textMuted,
  },
  pressed: {
    opacity: 0.6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  // 2.0 review write — top: -mx-4 border-bottom px-4 pb-6
  workSection: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: 12,
  },
  warningText: {
    ...Typography.caption1Medium,
    color: C.error,
  },
  // 2.0 “리뷰 작성” heading-2 mt-6 pl-1
  sectionHeading: {
    ...Typography.heading2,
    color: C.text,
    marginTop: 24,
    paddingLeft: 4,
    marginBottom: 0,
  },
  // 2.0: -mx-4 px-4 border-bottom + textarea h-60 mt-4 px-1
  textareaWrap: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  textarea: {
    height: 240,
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 16,
    ...Typography.body2Medium,
    color: Gray[700],
    padding: 0,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
})
