import { Image } from 'expo-image'
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native'

const officialMarkIcon = require('../../../assets/icons/common/icon-official-mark.png')

type OfficialMarkProps = {
  role?: string | null
  size?: number
  style?: StyleProp<ImageStyle>
}

export function OfficialMark({ role, size = 18, style }: OfficialMarkProps) {
  if (role !== 'ADMIN') return null

  return (
    <Image
      source={officialMarkIcon}
      style={[styles.icon, { width: size, height: size }, style]}
      contentFit="contain"
      accessibilityLabel="공식 계정"
    />
  )
}

const styles = StyleSheet.create({
  icon: {
    marginLeft: 4,
    flexShrink: 0,
  },
})
