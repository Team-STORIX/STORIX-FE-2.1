import React, { useState } from 'react'
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
import { useCreateReaderBoard } from '../hooks'

const MAX_CONTENT = 1000

function parseWorksId(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

export function FeedWriteEntryScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ worksId?: string }>()
  const worksId = parseWorksId(params.worksId)
  const worksQuery = useWorksDetail(worksId ?? 0)
  const work = worksQuery.data

  const [content, setContent] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [spoilerScript, setSpoilerScript] = useState('')
  const submitMutation = useCreateReaderBoard()
  const canSubmit = content.trim().length > 0 && !submitMutation.isPending

  const workMeta = [work?.author, work?.worksType, work?.genre]
    .filter(Boolean)
    .join(' · ')

  async function handleSubmit() {
    if (!canSubmit) return
    try {
      await submitMutation.mutateAsync({
        isWorksSelected: !!worksId,
        worksId,
        isSpoiler,
        spoilerScript: isSpoiler ? spoilerScript.trim() : '',
        content: content.trim(),
      })
      router.replace('/(tabs)/feed' as never)
    } catch {
      Alert.alert('오류', '게시글 등록에 실패했어요. 잠시 후 다시 시도해 주세요.')
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

        <Text style={styles.headerTitle}>피드 작성</Text>

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
        {worksId ? (
          worksQuery.isLoading ? (
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
          )
        ) : null}

        <View style={styles.inputCard}>
          <TextInput
            style={styles.contentInput}
            placeholder="내용을 입력해주세요."
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
              style={[styles.contentInput, styles.spoilerInput]}
              placeholder="스포일러 내용을 작성해주세요."
              placeholderTextColor={C.textMuted}
              value={spoilerScript}
              onChangeText={setSpoilerScript}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        {/* TODO(Phase UI-FEED-2): wire expo-image-picker + presigned URL upload */}
        <View style={styles.imageRow}>
          <Ionicons name="image-outline" size={22} color={C.textMuted} />
          <Text style={styles.imageRowText}>사진 추가 (준비 중)</Text>
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
  inputCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: S.inputH,
    paddingVertical: 14,
    gap: 8,
  },
  contentInput: {
    ...Typography.body2Medium,
    color: C.text,
    minHeight: 120,
    padding: 0,
  },
  spoilerInput: {
    minHeight: 80,
  },
  charCount: {
    ...Typography.caption2Medium,
    color: C.textMuted,
    textAlign: 'right',
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
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: S.inputH,
  },
  imageRowText: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
})
