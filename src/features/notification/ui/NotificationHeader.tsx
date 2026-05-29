import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C , Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const menuIcon = require('../../../../assets/icons/common/menu-3dots.svg')

type Props = {
  title?: string
  onBack: () => void
  /** Omit to hide the right-hand menu button (e.g. on the detail screen). */
  onMenuPress?: () => void
}

/**
 * Shared notification top bar. Height 56, horizontal padding 16, centered
 * title, 24×24 back (left) and menu (right) icons — matches Figma 7086:23601.
 */
export function NotificationHeader({ title = '알림', onBack, onMenuPress }: Props) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        style={({ pressed }) => [styles.iconBox, pressed && styles.pressed]}
      >
        <Image source={backIcon} style={styles.icon} contentFit="contain" />
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      {onMenuPress ? (
        <Pressable
          onPress={onMenuPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="알림 메뉴"
          style={({ pressed }) => [styles.iconBox, pressed && styles.pressed]}
        >
          <Image source={menuIcon} style={styles.icon} contentFit="contain" />
        </Pressable>
      ) : (
        <View style={styles.iconBox} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
  },
  pressed: {
    opacity: 0.6,
  },
})
