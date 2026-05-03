import { Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'

const plusIcon = require('../../../../assets/icons/navbar/plus.svg')

type Props = {
  isOpen: boolean
  onPress: () => void
  bottom: number
}

export function PlusActionButton({ isOpen, onPress, bottom }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { bottom, transform: [{ rotate: isOpen ? '90deg' : '0deg' }] },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="추가"
      accessibilityState={{ expanded: isOpen }}
    >
      <Image source={plusIcon} style={styles.icon} contentFit="contain" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    zIndex: 60,
  },
  icon: {
    width: 56,
    height: 56,
  },
  pressed: {
    opacity: 0.84,
  },
})
