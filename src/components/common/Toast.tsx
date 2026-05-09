import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Shadow, Typography } from '../../theme'

type ToastProps = {
  message?: string | null
  /** Where to anchor the toast (default: bottom). */
  position?: 'bottom' | 'center'
  /** Extra space (in addition to safe-area) above the bottom edge. */
  bottomOffset?: number
  /** Style override for the toast bubble. */
  bubbleStyle?: ViewStyle
}

export function Toast({
  message,
  position = 'bottom',
  bottomOffset = 24,
  bubbleStyle,
}: ToastProps) {
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!message) {
      opacity.setValue(0)
      return
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [message, opacity])

  if (!message) return null

  const wrapperStyle: ViewStyle =
    position === 'center'
      ? { justifyContent: 'center' }
      : {
          justifyContent: 'flex-end',
          paddingBottom: insets.bottom + bottomOffset,
        }

  return (
    <View pointerEvents="none" style={[styles.overlay, wrapperStyle]}>
      <Animated.View style={[styles.bubble, bubbleStyle, { opacity }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bubble: {
    maxWidth: '100%',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Gray[900],
    justifyContent: 'center',
    ...Shadow.lg,
  },
  text: {
    ...Typography.body2Medium,
    color: C.card,
    textAlign: 'center',
  },
})
