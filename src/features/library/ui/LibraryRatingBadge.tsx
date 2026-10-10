import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { C, Gray, Radius, Typography } from '../../../theme'

const littleStarIcon = require('../../../../assets/icons/common/littleStar.svg')

type Props = {
  value: number
  variant?: 'inline' | 'chip'
}

export function LibraryRatingBadge({ value, variant = 'inline' }: Props) {
  const safeValue = Number.isFinite(value) ? value : 0
  const isChip = variant === 'chip'

  return (
    <View style={isChip ? styles.chip : styles.inline}>
      <Image
        source={littleStarIcon}
        style={isChip ? styles.chipStar : styles.inlineStar}
        contentFit="contain"
      />
      <Text style={isChip ? styles.chipText : styles.inlineText}>
        {safeValue.toFixed(1)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inlineStar: {
    width: 9,
    height: 10,
  },
  inlineText: {
    ...Typography.caption1Medium,
    color: C.primary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 4,
    backgroundColor: C.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Gray[200],
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipStar: {
    width: 14,
    height: 14,
  },
  chipText: {
    ...Typography.caption1Semibold,
    color: C.primary,
  },
})
