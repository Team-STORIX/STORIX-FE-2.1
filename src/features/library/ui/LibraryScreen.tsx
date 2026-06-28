import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Radius, Typography } from '../../../theme'
import { ReviewWriteBottomSheet } from '../../plus'
import { type LibraryReviewSort } from '../api'
import { useLibraryReviewInfinite } from '../hooks'
import { LibraryEmptyState } from './LibraryEmptyState'
import { LibraryGalleryCarousel } from './LibraryGalleryCarousel'
import { LibraryHeader } from './LibraryHeader'
import { LibraryWorksList } from './LibraryWorksList'
import type { LibraryUiWork } from './types'

const arrowDownIcon = require('../../../../assets/icons/common/arrow-down.svg')
const galleryIcon = require('../../../../assets/icons/library/icon-gallery.svg')
const listIcon = require('../../../../assets/icons/library/icon-list.svg')
const cancelIcon = require('../../../../assets/icons/common/cancel.svg')
const checkPinkIcon = require('../../../../assets/icons/common/check-pink.svg')

type SortKey = 'DEFAULT' | 'RATING' | 'REVIEWS'
type ViewMode = 'list' | 'gallery'

const SORT_LABELS: Record<SortKey, string> = {
  DEFAULT: '기본순',
  RATING: '별점 높은 순',
  REVIEWS: '리뷰 많은 순',
}

const SORT_OPTIONS: SortKey[] = ['DEFAULT', 'RATING', 'REVIEWS']

const API_SORT: Record<SortKey, LibraryReviewSort> = {
  DEFAULT: 'LATEST',
  RATING: 'DESC_RATING',
  REVIEWS: 'LATEST',
}

const TAB_BAR_CLEARANCE = 128

export function LibraryScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [mode, setMode] = useState<ViewMode>('list')
  const [sort, setSort] = useState<SortKey>('DEFAULT')
  const [pendingSort, setPendingSort] = useState<SortKey>('DEFAULT')
  const [sortOpen, setSortOpen] = useState(false)
  const [showReviewSheet, setShowReviewSheet] = useState(false)

  const apiSort = API_SORT[sort]

  const reviewQuery = useLibraryReviewInfinite({ sort: apiSort })

  const works = useMemo<LibraryUiWork[]>(() => {
    const items = reviewQuery.data?.pages.flatMap((page) => page.result.content) ?? []
    const mapped = items.map((item) => {
      const ratingRaw = item.rating ?? item.avgRating ?? 0

      return {
        id: item.worksId,
        reviewId: item.reviewId,
        title: item.worksName ?? '',
        meta: [item.artistName ?? '', item.worksType ?? '']
          .filter(Boolean)
          .join(' · '),
        thumb: item.thumbnailUrl ?? '',
        rating: Number(ratingRaw ?? 0),
        reviewCount: item.reviewCount ?? (item.reviewId ? 1 : 0),
      }
    })

    if (sort === 'REVIEWS') {
      return mapped
        .map((work, index) => ({ work, index }))
        .sort((a, b) => {
          const diff = b.work.reviewCount - a.work.reviewCount
          return diff !== 0 ? diff : a.index - b.index
        })
        .map((entry) => entry.work)
    }

    return mapped
  }, [reviewQuery.data?.pages, sort])

  const worksCount = reviewQuery.data?.pages?.[0]?.totalReviewCount ?? works.length

  const openSort = () => {
    setPendingSort(sort)
    setSortOpen(true)
  }

  const closeSort = () => setSortOpen(false)

  const applySort = () => {
    setSort(pendingSort)
    setSortOpen(false)
  }

  const bottomClearance = Math.max(TAB_BAR_CLEARANCE, insets.bottom + 96)

  const openWorkReview = (item: LibraryUiWork) => {
    if (item.reviewId != null) {
      router.push(
        `/works/review/${item.reviewId}?from=library&worksId=${item.id}` as never,
      )
      return
    }

    router.push(`/works/${item.id}` as const)
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerLayer}>
        <LibraryHeader onSearchPress={() => router.push('/library/search' as never)} />

        <View style={styles.controlsWrap}>
          <Pressable
            style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
            onPress={openSort}
            accessibilityRole="button"
            accessibilityLabel="정렬"
          >
            <Text style={styles.sortButtonText}>{SORT_LABELS[sort]}</Text>
            <Image source={arrowDownIcon} style={styles.arrowIcon} contentFit="contain" />
          </Pressable>

          <View style={styles.rightControls}>
            <Text style={styles.countText}>{worksCount}개</Text>
            <Pressable
              style={({ pressed }) => pressed && styles.pressed}
              onPress={() => setMode((prev) => (prev === 'list' ? 'gallery' : 'list'))}
              accessibilityRole="button"
              accessibilityLabel={mode === 'list' ? '갤러리형 보기' : '리스트형 보기'}
            >
              <Image
                source={mode === 'list' ? galleryIcon : listIcon}
                style={styles.modeIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {reviewQuery.isLoading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : reviewQuery.isError ? (
          <View style={styles.stateWrap}>
            <Text style={styles.stateText}>서재를 불러오지 못했어요.</Text>
          </View>
        ) : works.length === 0 ? (
          <LibraryEmptyState
            title="아직 리뷰한 작품이 없어요."
            buttonText="서재에 작품 추가하러 가기"
            onPressButton={() => setShowReviewSheet(true)}
          />
        ) : mode === 'list' ? (
          <LibraryWorksList
            data={works}
            bottomInset={bottomClearance}
            isFetchingNextPage={reviewQuery.isFetchingNextPage}
            onEndReached={() => {
              if (reviewQuery.hasNextPage && !reviewQuery.isFetchingNextPage) {
                void reviewQuery.fetchNextPage()
              }
            }}
            onPressItem={openWorkReview}
          />
        ) : (
          <LibraryGalleryCarousel
            data={works}
            bottomInset={bottomClearance}
            hasNextPage={!!reviewQuery.hasNextPage}
            isFetchingNextPage={reviewQuery.isFetchingNextPage}
            onNeedMore={() => {
              if (reviewQuery.hasNextPage && !reviewQuery.isFetchingNextPage) {
                void reviewQuery.fetchNextPage()
              }
            }}
            onPressItem={openWorkReview}
          />
        )}
      </View>

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSort}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeSort}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>정렬</Text>
              <Pressable
                style={({ pressed }) => [styles.sheetClose, pressed && styles.pressed]}
                onPress={closeSort}
                accessibilityRole="button"
                accessibilityLabel="닫기"
              >
                <Image source={cancelIcon} style={styles.sheetCloseIcon} contentFit="contain" />
              </Pressable>
            </View>

            <View style={styles.sheetOptions}>
              {SORT_OPTIONS.map((option) => {
                const selected = pendingSort === option
                return (
                  <Pressable
                    key={option}
                    style={({ pressed }) => [
                      styles.sheetOption,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setPendingSort(option)}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.sheetOptionText,
                        selected && styles.sheetOptionTextActive,
                      ]}
                    >
                      {SORT_LABELS[option]}
                    </Text>
                    {selected ? (
                      <Image
                        source={checkPinkIcon}
                        style={styles.sheetCheckIcon}
                        contentFit="contain"
                      />
                    ) : null}
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.sheetButtons}>
              <Pressable
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
                onPress={() => setPendingSort('DEFAULT')}
                accessibilityRole="button"
              >
                <Text style={styles.resetButtonText}>초기화</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}
                onPress={applySort}
                accessibilityRole="button"
              >
                <Text style={styles.applyButtonText}>적용하기</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  headerLayer: {
    backgroundColor: C.card,
  },
  controlsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Gray[200],
    backgroundColor: C.card,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    ...Typography.body2Medium,
    color: Gray[500],
    marginRight: 2,
  },
  arrowIcon: {
    width: 24,
    height: 24,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  modeIcon: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(19, 17, 18, 0.6)',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Gray[200],
  },
  sheetTitle: {
    ...Typography.heading2,
    color: C.text,
  },
  sheetClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseIcon: {
    width: 24,
    height: 24,
  },
  sheetOptions: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetOptionText: {
    ...Typography.body1Medium,
    color: C.text,
  },
  sheetOptionTextActive: {
    color: C.primary,
  },
  sheetCheckIcon: {
    width: 24,
    height: 24,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  resetButton: {
    width: 105,
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Gray[100],
  },
  resetButtonText: {
    ...Typography.body1Medium,
    color: C.black,
  },
  applyButton: {
    flex: 1,
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Gray[900],
  },
  applyButtonText: {
    ...Typography.body1Medium,
    color: C.card,
  },
})
