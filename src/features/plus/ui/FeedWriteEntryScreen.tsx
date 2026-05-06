import { useEffect, useMemo, useState } from 'react'
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
import { C, Gray } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { Typography } from '../../../theme/typography'
import { useWorksDetail } from '../../works'
import { useCreateReaderBoard } from '../hooks'
import { FeedWritePickerBottomSheet, type PickedFeedWork } from './FeedWritePickerBottomSheet'
import { SpoilerToggleSection } from './SpoilerToggleSection'
import { WriteTargetWorkCard } from './WriteTargetWorkCard'

const backIcon = require('../../../../assets/icons/common/back.svg')
const searchIcon = require('../../../../assets/icons/common/search.svg')
const activeIcon = require('../../../../assets/icons/common/active.svg')
const deactiveIcon = require('../../../../assets/icons/common/deactive.svg')
const photoIcon = require('../../../../assets/icons/feed/icon-photo.svg')

const MAX_CONTENT_LENGTH = 300
const FEED_DEFAULT_SPOILER = '스포일러가 포함된 피드 보기'

function parseWorksId(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

export function FeedWriteEntryScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ worksId?: string }>()
  const initialWorksId = parseWorksId(params.worksId)
  const queryClient = useQueryClient()

  const [selectedWork, setSelectedWork] = useState<PickedFeedWork | null>(null)
  const [isWorksNotNeeded, setIsWorksNotNeeded] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const [text, setText] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [spoilerMessage, setSpoilerMessage] = useState('')

  const submitMutation = useCreateReaderBoard()

  // Hydrate selectedWork from worksId route param using useWorksDetail
  const initialWorksQuery = useWorksDetail(initialWorksId ?? 0)
  useEffect(() => {
    if (!initialWorksId) return
    if (selectedWork?.id === initialWorksId) return
    const w = initialWorksQuery.data
    if (!w) return
    setSelectedWork({
      id: initialWorksId,
      title: w.worksName ?? '',
      meta: [w.author, w.worksType].filter(Boolean).join(' · '),
      thumb: w.thumbnailUrl ?? '',
    })
  }, [initialWorksId, initialWorksQuery.data, selectedWork?.id])

  const content = text.trim()
  const contentLength = text.length

  const canSubmit = useMemo(() => {
    if (content.length === 0) return false
    if (contentLength > MAX_CONTENT_LENGTH) return false
    if (isWorksNotNeeded) return true
    if (!selectedWork?.id) return false
    return true
  }, [content.length, contentLength, isWorksNotNeeded, selectedWork?.id])

  const handleToggleNotNeeded = () => {
    setIsWorksNotNeeded((prev) => {
      const next = !prev
      if (next) setSelectedWork(null)
      return next
    })
  }

  const onSubmit = async () => {
    if (!canSubmit || submitMutation.isPending) return

    const isWorksSelected = !isWorksNotNeeded && !!selectedWork?.id
    const worksId = selectedWork?.id ?? 0

    try {
      await submitMutation.mutateAsync({
        isWorksSelected,
        worksId,
        isSpoiler: spoiler,
        spoilerScript: spoiler ? spoilerMessage.trim() : '',
        content,
      })

      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['plus', 'board'] })

      router.replace('/(tabs)/feed' as never)
    } catch (e) {
      Alert.alert(
        '피드 등록 실패',
        e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.',
      )
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
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Image source={backIcon} style={styles.headerIcon} contentFit="contain" />
        </Pressable>

        <Text style={styles.headerTitle}>피드</Text>

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
          { paddingBottom: insets.bottom + 80 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.worksHeaderRow}>
          <Text style={styles.sectionHeading}>작품선택</Text>
          <View style={styles.notNeededRow}>
            <Text style={styles.notNeededLabel}>작품선택이 필요없어요</Text>
            <Pressable
              onPress={handleToggleNotNeeded}
              hitSlop={6}
              accessibilityRole="switch"
              accessibilityState={{ checked: isWorksNotNeeded }}
              accessibilityLabel="작품선택 필요없음 토글"
            >
              <Image
                source={isWorksNotNeeded ? activeIcon : deactiveIcon}
                style={styles.toggleIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>

        {!isWorksNotNeeded ? (
          <>
            <Pressable
              onPress={() => setIsPickerOpen(true)}
              style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="작품 검색"
            >
              <Text style={styles.searchPlaceholder}>
                함께 이야기하고 싶은 작품을 검색하세요
              </Text>
              <Image
                source={searchIcon}
                style={styles.searchIcon}
                contentFit="contain"
              />
            </Pressable>

            {selectedWork ? (
              <View style={styles.selectedWorkWrap}>
                <WriteTargetWorkCard
                  title={selectedWork.title}
                  meta={selectedWork.meta}
                  thumbnailUrl={selectedWork.thumb || undefined}
                  loading={
                    !!initialWorksId &&
                    selectedWork.id === initialWorksId &&
                    initialWorksQuery.isLoading
                  }
                />
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.boardSectionHeader}>
          <Text style={styles.sectionHeading}>게시글 작성</Text>
        </View>

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
          defaultMessage={FEED_DEFAULT_SPOILER}
        />
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 },
        ]}
      >
        {/* TODO(image-upload): native image picking is not yet wired; affordance is visual-only. */}
        <View style={styles.imagePicker}>
          <Image source={photoIcon} style={styles.photoIcon} contentFit="contain" />
          <Text style={styles.imageCount}>0/3</Text>
        </View>

        <Text style={styles.contentCounter}>
          <Text
            style={
              contentLength === MAX_CONTENT_LENGTH
                ? styles.contentCounterWarn
                : styles.contentCounterValue
            }
          >
            {contentLength}
          </Text>
          <Text style={styles.contentCounterTotal}>/{MAX_CONTENT_LENGTH}</Text>
        </Text>
      </View>

      <FeedWritePickerBottomSheet
        visible={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onPick={(work) => {
          setSelectedWork(work)
          setIsWorksNotNeeded(false)
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.card,
  },
  // 2.0: h-13.5 (= 54px)
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
    color: '#f80078',
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
  // 2.0 “작품선택” section header — heading-2, mt-6 mb-4
  worksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeading: {
    ...Typography.heading2,
    color: C.text,
  },
  notNeededRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notNeededLabel: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  toggleIcon: {
    width: 32,
    height: 18,
  },
  // 2.0: rounded-lg bg-gray-50 border-gray-50 px-2 py-3 body-1
  searchBar: {
    position: 'relative',
    width: '100%',
    borderRadius: Radius.sm,
    backgroundColor: Gray[50],
    borderWidth: 1,
    borderColor: Gray[50],
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchPlaceholder: {
    ...Typography.body1Medium,
    color: Gray[400],
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
  },
  selectedWorkWrap: {
    marginBottom: 24,
  },
  // 2.0: -mx-4 px-4 border-t border-gray-100 + heading-2 mt-6
  boardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: 24,
  },
  // 2.0: -mx-4 px-4 mt-4 h-60 (240px) border-bottom
  textareaWrap: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  textarea: {
    height: 240,
    width: '100%',
    ...Typography.body1Medium,
    color: Gray[700],
    padding: 0,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoIcon: {
    width: 24,
    height: 24,
  },
  imageCount: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  contentCounter: {
    ...Typography.body1Bold,
  },
  contentCounterValue: {
    color: Gray[400],
  },
  contentCounterWarn: {
    color: '#ef433e',
  },
  contentCounterTotal: {
    color: C.textMuted,
  },
})
