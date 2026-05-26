import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray } from '../../../theme'
import { ReviewWriteBottomSheet } from '../../plus'
import { useProfileRatings } from '../hooks'
import type { RatingCountsMap } from '../types'

const writeReviewButton = require('../../../../assets/icons/profile/write-review.svg')

const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const
const MAX_HEIGHT = 120

function parseCountsToStepMap(raw: RatingCountsMap): Record<number, number> {
  const parsed: Record<number, number> = {}

  for (const [key, value] of Object.entries(raw ?? {})) {
    const normalized = key.trim().replace(/_/g, '.')
    const match = normalized.match(/(\d+(\.\d+)?)/g)
    const numericKey = match ? match[match.length - 1] : normalized
    const rating = Number.parseFloat(numericKey)

    if (!Number.isNaN(rating)) {
      parsed[rating] =
        (parsed[rating] ?? 0) + (Number.isFinite(value) ? Number(value) : 0)
    }
  }

  const stepMap: Record<number, number> = {}
  for (const step of RATING_STEPS) {
    stepMap[step] = parsed[step] ?? 0
  }

  return stepMap
}

export function ProfileRatingSection() {
  const [showReviewSheet, setShowReviewSheet] = useState(false)
  const ratingsQuery = useProfileRatings()

  const stepCounts = useMemo(
    () => parseCountsToStepMap(ratingsQuery.data ?? {}),
    [ratingsQuery.data],
  )

  const ratingData = useMemo(
    () =>
      RATING_STEPS.map((rating) => ({
        rating,
        count: stepCounts[rating] ?? 0,
        key: String(rating),
      })),
    [stepCounts],
  )

  const maxCount = useMemo(() => {
    const max = Math.max(...ratingData.map((item) => item.count))
    return Number.isFinite(max) ? max : 0
  }, [ratingData])

  const totalReviews = useMemo(
    () => ratingData.reduce((sum, item) => sum + item.count, 0),
    [ratingData],
  )

  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0
    const total = ratingData.reduce(
      (sum, item) => sum + item.rating * item.count,
      0,
    )

    return Math.round((total / totalReviews) * 10) / 10
  }, [ratingData, totalReviews])

  const mostGivenRating = useMemo(() => {
    if (totalReviews === 0 || maxCount <= 0) return 0
    const candidates = ratingData
      .filter((item) => item.count === maxCount)
      .map((item) => item.rating)

    return candidates.length > 0 ? Math.max(...candidates) : 0
  }, [maxCount, ratingData, totalReviews])

  const getBarHeight = (count: number) => {
    if (count === 0 || maxCount <= 0) return 1
    return (count / maxCount) * MAX_HEIGHT
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.title}>별점 분포</Text>

        {ratingsQuery.isError ? (
          <Text style={styles.errorText}>별점 분포를 불러오지 못했어요.</Text>
        ) : null}

        {totalReviews === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>아직 리뷰가 없어요...</Text>
            <Pressable
              onPress={() => setShowReviewSheet(true)}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="리뷰 작성"
            >
              <Image source={writeReviewButton} style={styles.writeReviewImage} contentFit="contain" />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.chartWrap}>
              <View style={styles.chartRow}>
                {ratingData.map((item) => {
                  const hasData = item.count > 0
                  const isMaxBar = hasData && item.count === maxCount
                  const opacity = isMaxBar ? 1 : 0.4

                  return (
                    <View key={item.key} style={styles.chartItem}>
                      {hasData ? (
                        <Text style={[styles.chartLabel, { opacity }]}>
                          {String(item.rating)}
                        </Text>
                      ) : null}

                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: getBarHeight(item.count),
                            opacity: hasData ? opacity : 0.4,
                          },
                        ]}
                      />
                    </View>
                  )
                })}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{averageRating}</Text>
                <Text style={styles.statLabel}>별점 평균</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalReviews}</Text>
                <Text style={styles.statLabel}>리뷰 수</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{mostGivenRating}</Text>
                <Text style={styles.statLabel}>많이 준 별점</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <ReviewWriteBottomSheet
        visible={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: C.text,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: Gray[500],
  },
  emptyState: {
    marginTop: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: Gray[500],
  },
  writeReviewImage: {
    width: 131,
    height: 36,
    marginTop: 12,
  },
  chartWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  chartRow: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  chartItem: {
    alignItems: 'center',
    gap: 8,
  },
  chartLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: C.text,
  },
  chartBar: {
    width: 28,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: C.primary,
  },
  statsRow: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: C.text,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Gray[500],
  },
  pressed: {
    opacity: 0.8,
  },
})
