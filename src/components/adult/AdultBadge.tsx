import { Image } from 'expo-image'
import type { ImageStyle, StyleProp } from 'react-native'

const adultChipIcon = require('../../../assets/verify/icon-adult-chips.svg')

type AdultBadgeProps = {
  /** 20 in the verification modal, 18 on thumbnails (Figma chips component). */
  size?: number
  style?: StyleProp<ImageStyle>
}

/** Magenta "19" chip used wherever adult-only content is marked. */
export function AdultBadge({ size = 20, style }: AdultBadgeProps) {
  return (
    <Image
      source={adultChipIcon}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      accessibilityLabel="19세 이용가"
    />
  )
}
