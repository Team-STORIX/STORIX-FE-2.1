import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { C, Radius, S, Typography } from '../../../theme'
import { useWorksDetail } from '../../works'
import { WriteTargetWorkCard } from './WriteTargetWorkCard'
import { useCreateReaderReview, usePlusReviewDuplicateCheck } from '../hooks'

const STAR_SIZE = 36
const MAX_CONTENT = 1000

function parseWorksId(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

type StarRatingInputProps = { rating: number; onChange: (v: number) => void }

function StarRatingInput({ rating, onChange }: StarRatingInputProps) {
  return (
    <View style={starStyles.row}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fullVal = i + 1
        const halfVal = i + 0.5
        const isFull = rating >= fullVal
        const isHalf = !isFull && rating >= halfVal
        return (
          <View key={i} style={starStyles.slot}>
            <Ionicons
              name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
              size={STAR_SIZE}
              color={rating >= halfVal ? C.primary : C.border}
            />
            <View style={[StyleSheet.absoluteFill, starStyles.tapRow]}>
              <Pressable style={starStyles.tapHalf} onPress={() => onChange(halfVal)} />
              <Pressable style={starStyles.tapHalf} onPress={() => onChange(fullVal)} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  slot: {
    width: STAR_SIZE,
    height: STAR_SIZE,
    position: 'relative',
  },
  tapRow: {
    flexDirection: 'row',
  },
  tapHalf: {
    flex: 1,
  },
})

export function ReviewWriteEntryScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ worksId?: string }>()
  const worksId = parseWorksId(params.worksId)
  const worksQuery = useWorksDetail(worksId ?? 0)
  const work = worksQuery.data
  const duplicateQuery = usePlusReviewDuplicateCheck(worksId)
  const isDuplicated = duplicateQuery.data?.result?.isDuplicated === true

  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [spoilerScript, setSpoilerScript] = useState('')

  const qc = useQueryClient()
  const submitMutation = useCreateReaderReview()
  const canSubmit =
    !!worksId &&
    rating > 0 &&
    content.trim().length > 0 &&
    !submitMutation.isPending &&
    !isDuplicated

  const workMeta = [work?.author, work?.worksType, work?.genre]
    .filter(Boolean)
    .join(' · ')

  async function handleSubmit() {
    if (!canSubmit || !worksId) return
    try {
      await submitMutation.mutateAsync({
        worksId,
        rating: String(rating),
        isSpoiler,
        spoilerScript: isSpoiler ? spoilerScript.trim() : '',
        content: content.trim(),
      })
      qc.invalidateQueries({ queryKey: ['works', 'review', 'list', worksId] })
      qc.invalidateQueries({ queryKey: ['works', 'review', 'me', worksId] })
      qc.invalidateQueries({ queryKey: ['works', 'detail', worksId] })
      router.replace(`/works/${worksId}` as never)
    } catch {
      Alert.alert('오류', '리뷰 등록에 실패했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

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
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>

        <Text style={styles.headerTitle}>리뷰 작성</Text>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBtn, pressed && canSubmit && styles.pressed]}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              등록
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {!worksId ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>선택된 작품이 없어요.</Text>
            <Text style={styles.errorBody}>작품 선택 화면에서 작품을 먼저 골라 주세요.</Text>
          </View>
        ) : worksQuery.isLoading ? (
          <View style={styles.cardLoader}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : worksQuery.isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>작품 정보를 불러오지 못했어요.</Text>
            <Text style={styles.errorBody}>잠시 후 다시 시도해 주세요.</Text>
          </View>
        ) : (
          <WriteTargetWorkCard
            title={work?.worksName ?? '선택한 작품'}
            meta={workMeta}
            thumbnailUrl={work?.thumbnailUrl ?? undefined}
          />
        )}

        {isDuplicated && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle-outline" size={18} color={C.primary} />
            <Text style={styles.warningText}>
              이미 작성한 리뷰가 있어요. 리뷰는 작품당 하나만 작성할 수 있어요.
            </Text>
          </View>
        )}

        <View style={styles.ratingCard}>
          <Text style={styles.ratingCardLabel}>평점</Text>
          <StarRatingInput rating={rating} onChange={setRating} />
          <Text style={styles.ratingHint}>
            {rating > 0 ? `${rating}점` : '별을 눌러 평점을 선택해주세요.'}
          </Text>
        </View>

        <View style={styles.spoilerRow}>
          <Text style={styles.spoilerLabel}>스포일러 포함</Text>
          <Switch
            value={isSpoiler}
            onValueChange={setIsSpoiler}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={C.card}
          />
        </View>

        {isSpoiler && (
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, styles.spoilerInput]}
              placeholder="스포일러 내용을 작성해주세요."
              placeholderTextColor={C.textMuted}
              value={spoilerScript}
              onChangeText={setSpoilerScript}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        <View style={styles.inputCard}>
          <TextInput
            style={[styles.textInput, styles.contentInput]}
            placeholder="리뷰 내용을 작성해주세요."
            placeholderTextColor={C.textMuted}
            value={content}
            onChangeText={(t) => setContent(t.slice(0, MAX_CONTENT))}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {content.length}/{MAX_CONTENT}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.screenH,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading4,
    color: C.text,
    flex: 1,
    textAlign: 'center',
  },
  submitText: {
    ...Typography.body2Bold,
    color: C.primary,
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
    paddingHorizontal: S.screenH,
    gap: 12,
  },
  cardLoader: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: S.cardPad,
    paddingVertical: 24,
    gap: 6,
  },
  errorTitle: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  errorBody: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.primaryMid,
    backgroundColor: C.primaryLight,
    paddingHorizontal: S.cardPad,
    paddingVertical: 12,
  },
  warningText: {
    ...Typography.body2Medium,
    color: C.text,
    flex: 1,
  },
  ratingCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: S.inputH,
    paddingVertical: 16,
    gap: 12,
  },
  ratingCardLabel: {
    ...Typography.caption1Extrabold,
    color: C.primary,
  },
  ratingHint: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  spoilerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: S.inputH,
    paddingVertical: 14,
  },
  spoilerLabel: {
    ...Typography.body2Medium,
    color: C.text,
  },
  inputCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: S.inputH,
    paddingVertical: 14,
    gap: 8,
  },
  textInput: {
    ...Typography.body2Medium,
    color: C.text,
    padding: 0,
  },
  spoilerInput: {
    minHeight: 80,
  },
  contentInput: {
    minHeight: 120,
  },
  charCount: {
    ...Typography.caption2Medium,
    color: C.textMuted,
    textAlign: 'right',
  },
})
