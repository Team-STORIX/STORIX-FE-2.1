import { useEffect, useRef, type ComponentProps } from 'react'
import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Shadow, Typography } from '../../theme'

const successIcon = require('../../../assets/icons/common/check-pink.svg')
const closeIcon = require('../../../assets/topicroom/icon-delete-medium.svg')

type ToastProps = {
  message?: string | null
  variant?: 'default' | 'success'
  leadingIconSource?: ComponentProps<typeof Image>['source']
  leadingIconSize?: number
  /** Where to anchor the toast (default: bottom). */
  position?: 'bottom' | 'center'
  /** Extra space (in addition to safe-area) above the bottom edge. */
  bottomOffset?: number
  /** Style override for the toast bubble. */
  bubbleStyle?: ViewStyle
  onClose?: () => void
}

export function Toast({
  message,
  variant = 'default',
  leadingIconSource,
  leadingIconSize = 24,
  position = 'bottom',
  bottomOffset = 36,
  bubbleStyle,
  onClose,
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
  const hasLeadingIcon = !!leadingIconSource

  const wrapperStyle: ViewStyle =
    position === 'center'
      ? { justifyContent: 'center' }
      : {
          justifyContent: 'flex-end',
          paddingBottom: insets.bottom + bottomOffset,
        }

  return (
    <View pointerEvents="box-none" style={[styles.overlay, wrapperStyle]}>
      <Animated.View
        style={[
          styles.bubble,
          hasLeadingIcon && styles.iconBubble,
          variant === 'success' && styles.successBubble,
          bubbleStyle,
          { opacity },
        ]}
      >
        {hasLeadingIcon ? (
          <Image
            source={leadingIconSource}
            style={{ width: leadingIconSize, height: leadingIconSize }}
            contentFit="contain"
          />
        ) : null}
        {variant === 'success' ? (
          <Image source={successIcon} style={styles.successIcon} contentFit="contain" />
        ) : null}
        <Text
          style={[
            styles.text,
            hasLeadingIcon && styles.iconText,
            variant === 'success' && styles.successText,
          ]}
          numberOfLines={1}
        >
          {message}
        </Text>
        <Pressable
          onPress={onClose}
          disabled={!onClose}
          hitSlop={8}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="토스트 닫기"
        >
          <Image
            source={closeIcon}
            style={styles.closeIcon}
            contentFit="contain"
            tintColor={Gray[300]}
          />
        </Pressable>
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
    width: 286,
    maxWidth: '100%',
    height: 48,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: Gray[900],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadow.lg,
  },
  iconBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successBubble: {
    width: 286,
    height: 48,
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Gray[900],
  },
  successIcon: {
    width: 20,
    height: 20,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    ...Typography.body2Medium,
    color: C.card,
    textAlign: 'left',
    flex: 1,
  },
  iconText: {
    textAlign: 'left',
  },
  successText: {
    flex: 1,
    textAlign: 'left',
  },
})
