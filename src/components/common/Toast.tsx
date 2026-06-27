import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Shadow, Typography } from '../../theme'

const successIcon = require('../../../assets/icons/common/check-pink.svg')
const closeIcon = require('../../../assets/icons/common/cancel.svg')

type ToastProps = {
  message?: string | null
  variant?: 'default' | 'success'
  /** Where to anchor the toast (default: bottom). */
  position?: 'bottom' | 'center'
  /** Extra space (in addition to safe-area) above the bottom edge. */
  bottomOffset?: number
  /** Style override for the toast bubble. */
  bubbleStyle?: ViewStyle
}

export function Toast({
  message,
  variant = 'default',
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
      <Animated.View
        style={[
          styles.bubble,
          variant === 'success' && styles.successBubble,
          bubbleStyle,
          { opacity },
        ]}
      >
        {variant === 'success' ? (
          <Image source={successIcon} style={styles.successIcon} contentFit="contain" />
        ) : null}
        <Text
          style={[styles.text, variant === 'success' && styles.successText]}
          numberOfLines={1}
        >
          {message}
        </Text>
        {variant === 'success' ? (
          <Image
            source={closeIcon}
            style={styles.closeIcon}
            contentFit="contain"
            tintColor={Gray[300]}
          />
        ) : null}
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
  successBubble: {
    width: 286,
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Gray[900],
  },
  successIcon: {
    width: 20,
    height: 20,
  },
  closeIcon: {
    width: 18,
    height: 18,
  },
  text: {
    ...Typography.body2Medium,
    color: C.card,
    textAlign: 'center',
  },
  successText: {
    flex: 1,
    textAlign: 'left',
  },
})
