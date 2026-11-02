import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { useProfileRatings } from '../hooks'
import { getProfileRatingStats } from '../lib/ratingStats'
import { ProfileFindWorksEmptyState } from './ProfileFindWorksEmptyState'

const MAX_HEIGHT = 120

export function ProfileRatingSection() {
  const ratingsQuery = useProfileRatings()

  const { ratingData, maxCount, totalReviews, averageRating, mostGivenRating } = useMemo(
    () => getProfileRatingStats(ratingsQuery.data),
    [ratingsQuery.data],
  )

  const getBarHeight = (count: number) => {
    if (count === 0 || maxCount <= 0) return 1
    return (count / maxCount) * MAX_HEIGHT
  }

  const getBarColor = (count: number, isMaxBar: boolean): string => {
    if (!count) return Magenta[100]
    if (isMaxBar) return Magenta[300]
    if (maxCount > 0 && count >= maxCount / 2) return Magenta[200]
    return Magenta[100]
  }

  return (
    <View style={styles.section}>
        <Text style={styles.title}>별점 분포</Text>

        {ratingsQuery.isError ? (
          <Text style={styles.errorText}>별점 분포를 불러오지 못했어요.</Text>
        ) : null}

        {totalReviews === 0 ? (
          <ProfileFindWorksEmptyState message="아직 별점 분포가 없어요" />
        ) : (
          <>
            <View style={styles.chartWrap}>
              <View style={styles.chartRow}>
                {ratingData.map((item) => {
                  const hasData = item.count > 0
                  const isMaxBar = hasData && item.count === maxCount

                  return (
                    <View key={item.key} style={styles.chartItem}>
                      {hasData ? (
                        <Text style={[styles.chartLabel, { color: isMaxBar ? C.text : Gray[400] }]}>
                          {String(item.rating)}
                        </Text>
                      ) : null}

                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: getBarHeight(item.count),
                            backgroundColor: getBarColor(item.count, isMaxBar),
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
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 28,
    borderBottomWidth: 6,
    borderBottomColor: C.bg,
    backgroundColor: C.card,
  },
  title: {
    ...Typography.heading3,
    color: C.text,
  },
  errorText: {
    marginTop: 8,
    ...Typography.caption1Medium,
    color: Gray[500],
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
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22.4,
  },
  chartBar: {
    width: 28,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22.4,
    color: C.text,
  },
  statLabel: {
    marginTop: 8,
    ...Typography.body2Medium,
    lineHeight: 19.6,
    color: Gray[500],
  },
})
