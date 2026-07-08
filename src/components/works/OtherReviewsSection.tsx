import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import type { WorksReviewItem } from '../../features/works'
import { C } from '../../theme/colors'
import { Typography } from '../../theme/typography'
import { OtherReviewCard } from './OtherReviewCard'

type Props = {
  reviews: WorksReviewItem[]
  isLoading?: boolean
  isError?: boolean
  isFetchingNextPage?: boolean
  onPressDetail: (reviewId: number) => void
  onPressLike: (reviewId: number) => void
  likingReviewId?: number | null
}

export function OtherReviewsSection({
  reviews,
  isLoading = false,
  isError = false,
  isFetchingNextPage = false,
  onPressDetail,
  onPressLike,
  likingReviewId,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>다른 유저들의 리뷰</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      ) : null}

      {!isLoading && isError ? (
        <Text style={styles.emptyText}>리뷰를 불러오지 못했어요</Text>
      ) : null}

      {!isLoading && !isError && reviews.length === 0 ? (
        <Text style={styles.emptyText}>아직 다른 유저 리뷰가 없어요</Text>
      ) : null}

      {reviews.map((item) => (
        <OtherReviewCard
          key={String(item.reviewId)}
          item={item}
          onPressDetail={onPressDetail}
          onPressLike={onPressLike}
          isLiking={likingReviewId === item.reviewId}
        />
      ))}

      {!isLoading && isFetchingNextPage ? (
        <View style={styles.nextLoaderRow}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: C.card,
  },
  // 2.0: heading-2 -mx-4 px-5 pt-5 pb-3
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  loaderRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  emptyText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  nextLoaderRow: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
