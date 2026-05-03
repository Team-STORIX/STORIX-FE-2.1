import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { Typography } from '../../theme/typography'

const emptyStar = require('../../../assets/icons/common/ratingStar.svg')
const filledStar = require('../../../assets/icons/common/middleStar.svg')

type StarRatingProps = {
  value?: number | null
  size?: number
  showValue?: boolean
}

export function StarRating({
  value,
  size = 18,
  showValue = false,
}: StarRatingProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(5, value ?? 0)) : 0

  return (
    <View style={styles.row}>
      <View style={[styles.starsRow, { gap: Math.max(3, Math.round(size * 0.16)) }]}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(0, Math.min(1, safeValue - index))
          return (
            <View key={index} style={{ width: size, height: size }}>
              <Image
                source={emptyStar}
                style={{ width: size, height: size }}
                contentFit="contain"
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { width: size * fill, overflow: 'hidden' },
                ]}
              >
                <Image
                  source={filledStar}
                  style={{ width: size, height: size }}
                  contentFit="contain"
                />
              </View>
            </View>
          )
        })}
      </View>
      {showValue ? <Text style={styles.value}>{safeValue.toFixed(1)}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginLeft: 8,
  },
})
