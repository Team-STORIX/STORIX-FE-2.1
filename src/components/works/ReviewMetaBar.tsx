import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'

const ratingStarIcon = require('../../../assets/icons/common/ratingStar.svg')
const middleStarIcon = require('../../../assets/icons/common/middleStar.svg')
const likeIcon = require('../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../assets/icons/common/icon-like-pink.svg')

type Props = {
  rating?: number | null
  likeCount?: number | null
  isLiked?: boolean
  onPressLike?: () => void
  isLiking?: boolean
}

function StaticRatingStars({ value, size = 18 }: { value: number; size?: number }) {
  const safe = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0))
  return (
    <View style={ratingStyles.row}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, safe - index))
        return (
          <View key={index} style={[ratingStyles.slot, { width: size, height: size }]}>
            <Image
              source={ratingStarIcon}
              style={{ width: size, height: size }}
              contentFit="contain"
            />
            {fill > 0 ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { width: size * fill, overflow: 'hidden' },
                ]}
              >
                <Image
                  source={middleStarIcon}
                  style={{ width: size, height: size }}
                  contentFit="contain"
                />
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

export function ReviewMetaBar({
  rating,
  likeCount,
  isLiked = false,
  onPressLike,
  isLiking = false,
}: Props) {
  const safeLikeCount = Math.max(0, Number(likeCount ?? 0))
  const showRating = typeof rating === 'number' && Number.isFinite(rating)

  const PillContent = (
    <>
      <Image
        source={isLiked ? likePinkIcon : likeIcon}
        style={styles.likeIcon}
        contentFit="contain"
      />
      <Text style={styles.likeCount}>{safeLikeCount}</Text>
    </>
  )

  return (
    <View style={styles.container}>
      <View style={styles.ratingArea}>
        {showRating ? (
          <>
            <StaticRatingStars value={rating!} size={18} />
            <Text style={styles.ratingValue}>{Number(rating).toFixed(1)}</Text>
          </>
        ) : null}
      </View>

      {onPressLike ? (
        <Pressable
          onPress={onPressLike}
          disabled={isLiking}
          style={({ pressed }) => [styles.likePill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? '리뷰 좋아요 취소' : '리뷰 좋아요'}
        >
          {PillContent}
        </Pressable>
      ) : (
        <View style={styles.likePill}>{PillContent}</View>
      )}
    </View>
  )
}

const ratingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slot: {
    position: 'relative',
  },
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ratingArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingValue: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  likePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: C.card,
    minHeight: 28,
    shadowColor: '#131112',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  likeIcon: {
    width: 16,
    height: 16,
  },
  likeCount: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
})
