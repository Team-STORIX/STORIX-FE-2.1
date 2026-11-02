import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'

const plusIcon = require('../../../../assets/icons/navbar/plus.svg')

const BUTTON_SIZE = 56

type Props = {
  isOpen: boolean
  onPress: () => void
  bottom: number
}

export function PlusActionButton({ isOpen, onPress, bottom }: Props) {
  const { width } = useWindowDimensions()
  const left = Math.round(width / 2 - BUTTON_SIZE / 2)
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isOpen, rotateAnim])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  })

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { bottom, left },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="추가"
      accessibilityState={{ expanded: isOpen }}
    >
      <Animated.View style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, transform: [{ rotate }] }}>
        <Image source={plusIcon} style={styles.icon} contentFit="contain" />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 60,
    elevation: 6,
  },
  icon: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  pressed: {
    opacity: 0.84,
  },
})
