import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Magenta, Gray, Radius , Typography } from '../../../theme'

type Props = {
  visible: boolean
  onClose: () => void
  onMarkAllRead: () => void
  onOpenSettings: () => void
}

/**
 * Dropdown shown under the header menu icon (Figma: shadow-2, radius 4).
 * Rendered with a full-screen transparent backdrop so a tap outside closes it.
 */
export function NotificationMenu({
  visible,
  onClose,
  onMarkAllRead,
  onOpenSettings,
}: Props) {
  if (!visible) return null

  return (
    <>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="메뉴 닫기"
      />
      <View style={styles.menu}>
        <Pressable
          onPress={onMarkAllRead}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.itemText, styles.markAll]}>모두 읽기</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          onPress={onOpenSettings}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.itemText, styles.settings]}>알림 설정</Text>
        </Pressable>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menu: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 96,
    backgroundColor: C.card,
    borderRadius: Radius.xs,
    padding: 8,
    gap: 6,
    zIndex: 11,
    // Figma shadow-2: rgba(19,17,18,0.2), y=2, blur=8.
    shadowColor: Gray[900],
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  item: {
    paddingVertical: 2,
  },
  itemText: {
    ...Typography.body2Medium,
  },
  markAll: {
    color: Magenta[300],
  },
  settings: {
    color: Gray[500],
  },
  divider: {
    height: 1,
    backgroundColor: C.divider,
  },
  pressed: {
    opacity: 0.6,
  },
})
