import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Radius, Typography } from '../../../theme'
import { ReviewWriteBottomSheet } from '../../navigation'
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

type SortKey = 'DEFAULT' | 'RATING' | 'RATING_ASC'
type ViewMode = 'list' | 'gallery'

const SORT_LABELS: Record<SortKey, string> = {
  DEFAULT: '전체 작품',
  RATING: '별점 높은 순',
  RATING_ASC: '별점 낮은 순',
}

const SORT_OPTIONS: SortKey[] = ['DEFAULT', 'RATING', 'RATING_ASC']

export function LibraryScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [mode, setMode] = useState<ViewMode>('list')
  const [sort, setSort] = useState<SortKey>('DEFAULT')
  const [sortOpen, setSortOpen] = useState(false)
  const [showReviewSheet, setShowReviewSheet] = useState(false)

  const apiSort: LibraryReviewSort =
    sort === 'DEFAULT' ? 'LATEST' : 'DESC_RATING'

  const reviewQuery = useLibraryReviewInfinite({ sort: apiSort })

  const works = useMemo<LibraryUiWork[]>(() => {
    const items = reviewQuery.data?.pages.flatMap((page) => page.result.content) ?? []
    const mapped = items.map((item) => {
      const ratingRaw = item.rating ?? item.avgRating ?? 0

      return {
        id: item.worksId,
        title: item.worksName ?? '',
        meta: [item.artistName ?? '', item.worksType ?? '', item.genre ?? '']
          .filter(Boolean)
          .join(' · '),
        thumb: item.thumbnailUrl ?? '',
        rating: Number(ratingRaw ?? 0),
        reviewCount: item.reviewId ? 1 : 0,
      }
    })

    if (sort === 'RATING_ASC') {
      return [...mapped].reverse()
    }

    return mapped
  }, [reviewQuery.data?.pages, sort])

  const worksCount = reviewQuery.data?.pages?.[0]?.totalReviewCount ?? works.length

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {sortOpen ? (
        <Pressable
          style={styles.sortOverlay}
          onPress={() => setSortOpen(false)}
          accessibilityRole="button"
        />
      ) : null}

      <View style={styles.headerLayer}>
        <LibraryHeader onSearchPress={() => router.push('/library/search' as never)} />

        <View style={styles.controlsWrap}>
          <View style={styles.sortWrap}>
            <Pressable
              style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
              onPress={() => setSortOpen((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel="정렬"
            >
              <Text style={styles.sortButtonText}>{SORT_LABELS[sort]}</Text>
              <Image
                source={arrowDownIcon}
                style={[styles.arrowIcon, sortOpen && styles.arrowIconOpen]}
                contentFit="contain"
              />
            </Pressable>

            {sortOpen ? (
              <View style={styles.sortMenu}>
                {SORT_OPTIONS.map((option, index) => (
                  <Pressable
                    key={option}
                    style={({ pressed }) => [
                      styles.sortMenuItem,
                      index !== SORT_OPTIONS.length - 1 && styles.sortMenuDivider,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      setSort(option)
                      setSortOpen(false)
                    }}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.sortMenuText,
                        sort === option && styles.sortMenuTextActive,
                      ]}
                    >
                      {SORT_LABELS[option]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

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
            isFetchingNextPage={reviewQuery.isFetchingNextPage}
            onEndReached={() => {
              if (reviewQuery.hasNextPage && !reviewQuery.isFetchingNextPage) {
                void reviewQuery.fetchNextPage()
              }
            }}
            onPressItem={(item) => router.push(`/works/${item.id}` as const)}
          />
        ) : (
          <LibraryGalleryCarousel
            data={works}
            hasNextPage={!!reviewQuery.hasNextPage}
            isFetchingNextPage={reviewQuery.isFetchingNextPage}
            onNeedMore={() => {
              if (reviewQuery.hasNextPage && !reviewQuery.isFetchingNextPage) {
                void reviewQuery.fetchNextPage()
              }
            }}
            onPressItem={(item) => router.push(`/works/${item.id}` as const)}
          />
        )}
      </View>

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
  sortOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  headerLayer: {
    zIndex: 2,
    backgroundColor: C.card,
  },
  controlsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  sortWrap: {
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sortButtonText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginRight: 2,
  },
  arrowIcon: {
    width: 16,
    height: 16,
  },
  arrowIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  sortMenu: {
    position: 'absolute',
    top: 30,
    left: 0,
    width: 96,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.card,
  },
  sortMenuItem: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
  },
  sortMenuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  sortMenuText: {
    ...Typography.body2Medium,
    color: C.text,
  },
  sortMenuTextActive: {
    fontWeight: '600',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countText: {
    ...Typography.body2Medium,
    color: Gray[400],
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
})
