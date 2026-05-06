import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { WorksReviewItem } from '../../features/works'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'
import { OtherReviewCard } from './OtherReviewCard'

const arrowForwardSmall = require('../../../assets/icons/common/icon-arrow-forward-small.svg')

type Props = {
  reviews: WorksReviewItem[]
  isLoading?: boolean
  isError?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onFetchNextPage?: () => void
  onPressDetail: (reviewId: number) => void
  onPressLike: (reviewId: number) => void
  likingReviewId?: number | null
}

export function OtherReviewsSection({
  reviews,
  isLoading = false,
  isError = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
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

      {hasNextPage && onFetchNextPage ? (
        <Pressable
          style={({ pressed }) => [
            styles.loadMoreButton,
            pressed && styles.pressed,
          ]}
          onPress={onFetchNextPage}
          disabled={isFetchingNextPage}
          accessibilityRole="button"
          accessibilityLabel="리뷰 더 보기"
        >
          {isFetchingNextPage ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <>
              <Text style={styles.loadMoreText}>리뷰 더 보기</Text>
              <Image
                source={arrowForwardSmall}
                style={styles.loadMoreIcon}
                contentFit="contain"
              />
            </>
          )}
        </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  loaderRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  emptyText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadMoreButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadMoreText: {
    ...Typography.body2Bold,
    color: C.primary,
  },
  loadMoreIcon: {
    width: 16,
    height: 16,
  },
  pressed: {
    opacity: 0.7,
  },
})
