import { useEffect, useMemo, useState } from 'react'
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Radius, Typography } from '../../../theme'
import {
  useDeleteLibraryRecentKeyword,
  useLibraryRecentKeywords,
  useLibrarySearchWorksInfinite,
} from '../hooks'
import { ReviewWriteBottomSheet } from '../../navigation'
import { LibraryEmptyState } from './LibraryEmptyState'
import { LibrarySearchHeader } from './LibrarySearchHeader'
import { LibraryWorksList } from './LibraryWorksList'
import type { LibraryUiWork } from './types'

const cancelIcon = require('../../../../assets/icons/common/cancel.svg')

function normalizeKeyword(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  return (value ?? '').replace(/^#/, '').trim()
}

function buildSearchHref(keyword: string) {
  return `/library/search?keyword=${encodeURIComponent(keyword)}`
}

function RecentKeywordChip({
  label,
  onPress,
  onRemove,
}: {
  label: string
  onPress: () => void
  onRemove: () => void
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.recentChip, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.recentChipText}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        onPress={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label} 삭제`}
      >
        <Image source={cancelIcon} style={styles.removeIcon} contentFit="contain" />
      </Pressable>
    </Pressable>
  )
}

export function LibrarySearchScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{ keyword?: string }>()

  const submittedKeyword = normalizeKeyword(params.keyword)
  const [inputValue, setInputValue] = useState(submittedKeyword)
  const [showReviewSheet, setShowReviewSheet] = useState(false)

  const recentKeywordsQuery = useLibraryRecentKeywords()
  const deleteRecentKeywordMutation = useDeleteLibraryRecentKeyword()
  const searchWorksQuery = useLibrarySearchWorksInfinite(submittedKeyword)

  useEffect(() => {
    setInputValue(submittedKeyword)
  }, [submittedKeyword])

  const works = useMemo<LibraryUiWork[]>(() => {
    const items = searchWorksQuery.data?.pages.flatMap((page) => page.content) ?? []

    return items.map((item) => ({
      id: item.worksId,
      title: item.worksName ?? '',
      meta: [item.artistName, item.worksType, item.genre].filter(Boolean).join(' · '),
      thumb: item.thumbnailUrl ?? '',
      rating: Number(item.rating ?? 0),
      reviewCount: 0,
    }))
  }, [searchWorksQuery.data?.pages])

  const recentKeywords = recentKeywordsQuery.data?.recentKeywords ?? []

  const submitKeyword = (raw: string) => {
    const keyword = normalizeKeyword(raw)
    Keyboard.dismiss()

    if (!keyword) {
      router.replace('/library/search' as never)
      return
    }

    router.replace(buildSearchHref(keyword) as never)
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
      <LibrarySearchHeader
        value={inputValue}
        onChangeText={setInputValue}
        onSubmit={() => submitKeyword(inputValue)}
        onBackPress={() => router.back()}
        onClearPress={() => {
          setInputValue('')
          if (submittedKeyword) {
            router.replace('/library/search' as never)
          }
        }}
      />

      {submittedKeyword ? (
        <View style={styles.resultsWrap}>
          {searchWorksQuery.isLoading ? (
            <View style={styles.messageWrap}>
              <Text style={styles.messageText}>불러오는 중이에요</Text>
            </View>
          ) : searchWorksQuery.isError ? (
            <LibraryEmptyState title="검색에 실패했어요." />
          ) : works.length === 0 ? (
            <LibraryEmptyState
              title={`찾으시는 '${submittedKeyword}'는\n아직 서재에 추가되지 않았어요.`}
              buttonText="서재에 작품 추가하러 가기"
              onPressButton={() => setShowReviewSheet(true)}
            />
          ) : (
            <LibraryWorksList
              data={works}
              isFetchingNextPage={searchWorksQuery.isFetchingNextPage}
              onEndReached={() => {
                if (searchWorksQuery.hasNextPage && !searchWorksQuery.isFetchingNextPage) {
                  void searchWorksQuery.fetchNextPage()
                }
              }}
              onPressItem={(item) => router.push(`/works/${item.id}` as const)}
            />
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.recentScroll}
          contentContainerStyle={styles.recentContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.recentTitle}>최근 검색어</Text>

          {recentKeywords.length > 0 ? (
            <View style={styles.chipsWrap}>
              {recentKeywords.map((keyword) => (
                <RecentKeywordChip
                  key={keyword}
                  label={keyword}
                  onPress={() => submitKeyword(keyword)}
                  onRemove={() => deleteRecentKeywordMutation.mutate(keyword)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyRecentText}>최근 검색어가 없어요</Text>
          )}
        </ScrollView>
      )}

      <ReviewWriteBottomSheet
        visible={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  resultsWrap: {
    flex: 1,
  },
  recentScroll: {
    flex: 1,
  },
  recentContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  recentTitle: {
    ...Typography.body1Medium,
    color: C.text,
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#F9F6F7',
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
  },
  recentChipText: {
    ...Typography.body2Medium,
    color: C.text,
  },
  removeButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeIcon: {
    width: 9,
    height: 9,
  },
  emptyRecentText: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  messageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  messageText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
})
