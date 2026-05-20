import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WarningEmptyState } from '../../src/components/common/WarningEmptyState'
import {
  findTopicRoomIdByWorksName,
  useCreateTopicRoom,
  useJoinTopicRoom,
} from '../../src/features/topicroom'
import { useWorksSearch } from '../../src/features/search/hooks/useSearch'
import type { WorksSearchItem } from '../../src/features/search/api/search.schema'
import { C, Gray, Radius, Typography } from '../../src/theme'

const backIcon = require('../../assets/icons/common/back.svg')
const searchIcon = require('../../assets/icons/common/search.svg')
const cancelIcon = require('../../assets/icons/common/cancel.svg')
const warningSmallIcon = require('../../assets/icons/common/warningSmall.svg')

const TOPIC_NAME_PATTERN = /^[0-9A-Za-z가-힣 ]{2,20}$/
const MAX_NAME_LENGTH = 20

type Step = 'works' | 'name'

export default function TopicRoomCreateScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<Step>('works')
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [selectedWorks, setSelectedWorks] = useState<WorksSearchItem | null>(
    null,
  )
  const [name, setName] = useState('')
  const [existingRoomId, setExistingRoomId] = useState<number | null>(null)
  const [checkingExisting, setCheckingExisting] = useState(false)

  const worksQuery = useWorksSearch({
    keyword: submittedKeyword,
    page: 0,
  })
  const createMutation = useCreateTopicRoom()
  const joinMutation = useJoinTopicRoom()

  const worksItems: WorksSearchItem[] =
    worksQuery.data?.result.content ?? []

  const handleBack = () => {
    if (step === 'name') {
      setStep('works')
      return
    }
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/feed?section=topicroom' as never)
  }

  const handleSubmitSearch = () => {
    const trimmed = keyword.trim()
    setSubmittedKeyword(trimmed)
  }

  const handleClearKeyword = () => {
    setKeyword('')
    setSubmittedKeyword('')
  }

  const handlePickWorks = async (item: WorksSearchItem) => {
    setSelectedWorks(item)
    setExistingRoomId(null)
    setCheckingExisting(true)
    try {
      const existing = await findTopicRoomIdByWorksName(item.worksName)
      if (existing != null) {
        setExistingRoomId(existing)
        return
      }
      setStep('name')
    } finally {
      setCheckingExisting(false)
    }
  }

  const handleEnterExisting = () => {
    if (existingRoomId == null) return
    joinMutation.mutate(existingRoomId, {
      onSuccess: () => router.replace(`/topicroom/${existingRoomId}` as const),
    })
  }

  const canCreate = useMemo(
    () => TOPIC_NAME_PATTERN.test(name.trim()) && selectedWorks != null,
    [name, selectedWorks],
  )

  const handleCreate = () => {
    if (!canCreate || !selectedWorks) return
    if (createMutation.isPending) return
    createMutation.mutate(
      { worksId: selectedWorks.worksId, topicRoomName: name.trim() },
      {
        onSuccess: (topicRoomId) => {
          router.replace(`/topicroom/${topicRoomId}` as const)
        },
      },
    )
  }

  useEffect(() => {
    if (step !== 'name') return
    if (selectedWorks == null) setStep('works')
  }, [step, selectedWorks])

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleBack}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Image source={backIcon} style={styles.icon24} contentFit="contain" />
        </Pressable>
        <Text style={styles.topBarTitle}>토픽룸 만들기</Text>
        <View style={styles.iconBtn} />
      </View>

      {step === 'works' ? (
        <WorksStep
          keyword={keyword}
          onChangeKeyword={setKeyword}
          onSubmitSearch={handleSubmitSearch}
          onClearKeyword={handleClearKeyword}
          submittedKeyword={submittedKeyword}
          loading={worksQuery.isLoading || worksQuery.isFetching}
          isError={worksQuery.isError}
          items={worksItems}
          onPickWorks={(item) => void handlePickWorks(item)}
          selectedWorksId={selectedWorks?.worksId ?? null}
          existingRoomId={existingRoomId}
          checkingExisting={checkingExisting}
          onEnterExisting={handleEnterExisting}
          isJoining={joinMutation.isPending}
        />
      ) : (
        <NameStep
          works={selectedWorks}
          name={name}
          onChangeName={(v) => setName(v.slice(0, MAX_NAME_LENGTH))}
          insetsBottom={insets.bottom}
          canCreate={canCreate}
          onCreate={handleCreate}
          isSubmitting={createMutation.isPending}
        />
      )}
    </KeyboardAvoidingView>
  )
}

function WorksStep({
  keyword,
  onChangeKeyword,
  onSubmitSearch,
  onClearKeyword,
  submittedKeyword,
  loading,
  isError,
  items,
  onPickWorks,
  selectedWorksId,
  existingRoomId,
  checkingExisting,
  onEnterExisting,
  isJoining,
}: {
  keyword: string
  onChangeKeyword: (v: string) => void
  onSubmitSearch: () => void
  onClearKeyword: () => void
  submittedKeyword: string
  loading: boolean
  isError: boolean
  items: WorksSearchItem[]
  onPickWorks: (item: WorksSearchItem) => void
  selectedWorksId: number | null
  existingRoomId: number | null
  checkingExisting: boolean
  onEnterExisting: () => void
  isJoining: boolean
}) {
  const showResults = submittedKeyword.length > 0
  const showEmpty = showResults && !loading && !isError && items.length === 0

  return (
    <View style={styles.flex}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepLabel}>작품 선택</Text>
        <Text style={styles.stepHelper}>
          토픽룸을 만들 작품을 검색해 선택해 주세요.
        </Text>
      </View>

      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Image
            source={searchIcon}
            style={styles.searchIcon}
            contentFit="contain"
            tintColor={C.textMuted}
          />
          <TextInput
            value={keyword}
            onChangeText={onChangeKeyword}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            placeholder="작품 이름을 검색해 주세요"
            placeholderTextColor={C.textMuted}
            style={styles.searchInput}
          />
          {keyword.length > 0 ? (
            <Pressable
              onPress={onClearKeyword}
              hitSlop={8}
              accessibilityLabel="검색어 지우기"
            >
              <Image
                source={cancelIcon}
                style={styles.searchClear}
                contentFit="contain"
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {existingRoomId != null ? (
        <ExistingRoomCallout
          onEnter={onEnterExisting}
          isJoining={isJoining}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator
          size="small"
          color={C.primary}
          style={styles.loaderInline}
        />
      ) : isError ? (
        <WarningEmptyState
          description="작품을 불러오지 못했어요."
          iconSize={96}
        />
      ) : showEmpty ? (
        <WarningEmptyState
          title="검색 결과가 없어요"
          description="다른 키워드로 다시 검색해 보세요."
          iconSize={120}
        />
      ) : (
        <FlatList
          data={showResults ? items : []}
          keyExtractor={(item) => `works_${item.worksId}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <WorksRow
              item={item}
              selected={selectedWorksId === item.worksId}
              busy={checkingExisting && selectedWorksId === item.worksId}
              onPress={() => onPickWorks(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
          ListEmptyComponent={
            !showResults ? (
              <Text style={styles.hintText}>
                검색어를 입력해 작품을 찾아보세요.
              </Text>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  )
}

function WorksRow({
  item,
  selected,
  busy,
  onPress,
}: {
  item: WorksSearchItem
  selected: boolean
  busy: boolean
  onPress: () => void
}) {
  const initial = (item.worksName || '?').slice(0, 1).toUpperCase()
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.worksRow,
        selected && styles.worksRowSelected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.worksThumbWrap}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.worksThumb}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.worksThumb, styles.worksThumbFallback]}>
            <Text style={styles.worksThumbFallbackText}>{initial}</Text>
          </View>
        )}
      </View>
      <View style={styles.worksBody}>
        <Text style={styles.worksName} numberOfLines={1}>
          {item.worksName}
        </Text>
        {item.artistName ? (
          <Text style={styles.worksArtist} numberOfLines={1}>
            {item.artistName}
          </Text>
        ) : null}
      </View>
      {busy ? <ActivityIndicator size="small" color={C.primary} /> : null}
    </Pressable>
  )
}

function ExistingRoomCallout({
  onEnter,
  isJoining,
}: {
  onEnter: () => void
  isJoining: boolean
}) {
  return (
    <View style={styles.existingCallout}>
      <Image
        source={warningSmallIcon}
        style={styles.existingIcon}
        contentFit="contain"
      />
      <View style={styles.existingTextBlock}>
        <Text style={styles.existingTitle}>이미 토픽룸이 있어요</Text>
        <Text style={styles.existingDescription}>
          기존 토픽룸으로 입장할 수 있어요.
        </Text>
      </View>
      <Pressable
        onPress={onEnter}
        disabled={isJoining}
        style={({ pressed }) => [
          styles.existingBtn,
          pressed && styles.pressed,
          isJoining && styles.existingBtnDisabled,
        ]}
        accessibilityRole="button"
      >
        {isJoining ? (
          <ActivityIndicator size="small" color={C.card} />
        ) : (
          <Text style={styles.existingBtnText}>입장</Text>
        )}
      </Pressable>
    </View>
  )
}

function NameStep({
  works,
  name,
  onChangeName,
  insetsBottom,
  canCreate,
  onCreate,
  isSubmitting,
}: {
  works: WorksSearchItem | null
  name: string
  onChangeName: (v: string) => void
  insetsBottom: number
  canCreate: boolean
  onCreate: () => void
  isSubmitting: boolean
}) {
  if (!works) return null

  const trimmed = name.trim()
  const helperOk = TOPIC_NAME_PATTERN.test(trimmed)
  const helperText =
    trimmed.length === 0
      ? '한글·영문·숫자 2~20자까지 입력 가능해요'
      : helperOk
        ? '사용 가능한 제목이에요'
        : '한글·영문·숫자 2~20자만 사용할 수 있어요'
  const helperColor = trimmed.length === 0
    ? C.textMuted
    : helperOk
      ? C.activeDot
      : C.error

  return (
    <View style={styles.flex}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepLabel}>토픽룸 이름 설정</Text>
        <Text style={styles.stepHelper}>
          어떤 이야기를 나눌 토픽룸인지 알려주세요.
        </Text>
      </View>

      <View style={styles.selectedWorksRow}>
        <View style={styles.worksThumbWrap}>
          {works.thumbnailUrl ? (
            <Image
              source={{ uri: works.thumbnailUrl }}
              style={styles.worksThumb}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.worksThumb, styles.worksThumbFallback]}>
              <Text style={styles.worksThumbFallbackText}>
                {(works.worksName || '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.worksBody}>
          <Text style={styles.worksName} numberOfLines={1}>
            {works.worksName}
          </Text>
          {works.artistName ? (
            <Text style={styles.worksArtist} numberOfLines={1}>
              {works.artistName}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.nameInputWrap}>
        <TextInput
          value={name}
          onChangeText={onChangeName}
          placeholder="토픽룸 이름을 입력해 주세요"
          placeholderTextColor={C.textMuted}
          style={styles.nameInput}
          maxLength={MAX_NAME_LENGTH}
        />
        <View style={styles.nameUnderline} />
        <View style={styles.nameMetaRow}>
          <Text style={[styles.nameHelper, { color: helperColor }]}>
            {helperText}
          </Text>
          <Text style={styles.nameCounter}>
            {trimmed.length}/{MAX_NAME_LENGTH}
          </Text>
        </View>
      </View>

      <View style={styles.warningBlock}>
        <Text style={styles.warningTitle}>토픽룸 생성 주의 사항</Text>
        <Text style={styles.warningBody}>
          모두가 함께 사용하는 커뮤니티로, 아래와 같은 제목은 삼가해주세요.
        </Text>
        <View style={styles.warningItem}>
          <Image
            source={warningSmallIcon}
            style={styles.warningItemIcon}
            contentFit="contain"
          />
          <Text style={styles.warningItemText}>
            특정 인물이나 집단을 비방하는 내용, 비속어, 혐오 표현이 포함된 내용
          </Text>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insetsBottom + 12 }]}>
        <Pressable
          onPress={onCreate}
          disabled={!canCreate || isSubmitting}
          style={({ pressed }) => [
            styles.primaryBtn,
            (!canCreate || isSubmitting) && styles.primaryBtnDisabled,
            pressed && canCreate && !isSubmitting && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={C.card} />
          ) : (
            <Text style={styles.primaryBtnText}>토픽룸 만들기</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.card },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: { width: 24, height: 24 },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    ...Typography.body1Bold,
    color: C.text,
  },

  stepHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 6,
  },
  stepLabel: {
    ...Typography.heading2,
    color: C.text,
  },
  stepHelper: {
    ...Typography.body2Medium,
    color: C.textSecondary,
  },

  searchBarWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.bg,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  searchIcon: { width: 18, height: 18 },
  searchInput: {
    flex: 1,
    ...Typography.body2Medium,
    color: C.text,
    paddingVertical: 0,
  },
  searchClear: { width: 16, height: 16 },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  rowSeparator: { height: 12 },
  worksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  worksRowSelected: {
    backgroundColor: C.primaryLight,
  },
  worksThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: C.divider,
  },
  worksThumb: { width: 56, height: 56 },
  worksThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryLight,
  },
  worksThumbFallbackText: {
    ...Typography.heading3,
    color: C.primary,
  },
  worksBody: {
    flex: 1,
    gap: 2,
  },
  worksName: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  worksArtist: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  pressed: { opacity: 0.85 },

  loaderInline: { marginTop: 24 },
  hintText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 56,
  },

  existingCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.primaryMid,
    backgroundColor: C.primaryLight,
  },
  existingIcon: { width: 20, height: 20 },
  existingTextBlock: { flex: 1, gap: 2 },
  existingTitle: {
    ...Typography.body2Bold,
    color: C.text,
  },
  existingDescription: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },
  existingBtn: {
    minWidth: 64,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  existingBtnDisabled: {
    opacity: 0.7,
  },
  existingBtnText: {
    ...Typography.body2Bold,
    color: C.card,
  },

  selectedWorksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  nameInputWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  nameInput: {
    ...Typography.heading3,
    color: C.text,
    paddingVertical: 8,
  },
  nameUnderline: {
    height: 2,
    backgroundColor: Gray[300],
  },
  nameMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  nameHelper: {
    ...Typography.caption1Medium,
  },
  nameCounter: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },

  warningBlock: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: Radius.md,
    backgroundColor: C.bg,
    gap: 8,
  },
  warningTitle: {
    ...Typography.body2Bold,
    color: C.text,
  },
  warningBody: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },
  warningItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  warningItemIcon: { width: 16, height: 16, marginTop: 2 },
  warningItemText: {
    flex: 1,
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },

  bottomBar: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    backgroundColor: C.card,
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  primaryBtnDisabled: {
    backgroundColor: C.primaryLight,
  },
  primaryBtnText: {
    ...Typography.body1Semibold,
    color: C.card,
  },
})
