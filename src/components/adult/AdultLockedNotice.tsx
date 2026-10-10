import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { C, Gray, Typography } from '../../theme'

const eyeBlockIcon = require('../../../assets/verify/icon-eyeblock.svg')

type AdultLockedPanelProps = {
  onPressVerify: () => void
}

/**
 * Replaces a feed post's works card and body (Figma 11290:50053): eye-block
 * icon, two-line notice and a pill button that starts verification.
 */
export function AdultLockedPanel({ onPressVerify }: AdultLockedPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.message}>
        <Image source={eyeBlockIcon} style={styles.icon} contentFit="contain" />
        <Text style={styles.panelText}>
          {'게시글 접근을 위해 성인인증이 필요합니다.\n성인 인증 후 이용해주세요'}
        </Text>
      </View>
      <Pressable
        onPress={onPressVerify}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        <Text style={styles.pillLabel}>성인 인증하기</Text>
      </Pressable>
    </View>
  )
}

/**
 * One-line notice for the compact today-feed card (Figma 11290:52003).
 * The whole card is the tap target, so there is no button here.
 */
export function AdultLockedInline() {
  return (
    <View style={styles.inline}>
      <Image source={eyeBlockIcon} style={styles.icon} contentFit="contain" />
      <Text style={styles.inlineText} numberOfLines={1}>
        성인인증 후 열람 가능한 콘텐츠입니다.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  message: {
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 24,
    height: 24,
  },
  panelText: {
    ...Typography.body2Medium,
    color: Gray[400],
    textAlign: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Gray[900],
  },
  pillLabel: {
    ...Typography.body2Medium,
    color: C.card,
    textAlign: 'center',
  },
  inline: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inlineText: {
    ...Typography.body2Medium,
    color: Gray[400],
    textAlign: 'center',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
})
