import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Magenta, Radius, Shadow, Typography } from '../../../theme'

type Props = {
  visible: boolean
  /** Y position (px from top of screen) to anchor the dropdown under the header. */
  topOffset: number
  onClose: () => void
  onPressReport: () => void
  onPressLeave: () => void
  reportDisabled?: boolean
  leaveDisabled?: boolean
}

export function TopicRoomMenuDropdown({
  visible,
  topOffset,
  onClose,
  onPressReport,
  onPressLeave,
  reportDisabled = false,
  leaveDisabled = false,
}: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
        <View style={[styles.box, { top: topOffset }]} pointerEvents="box-none">
          <View style={styles.menu}>
            <Pressable
              disabled={reportDisabled}
              onPress={() => {
                onClose()
                onPressReport()
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && !reportDisabled && styles.rowPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.rowText, reportDisabled && styles.disabledText]}>
                신고하기
              </Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              disabled={leaveDisabled}
              onPress={() => {
                onClose()
                onPressLeave()
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && !leaveDisabled && styles.rowPressed,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[styles.rowText, styles.destructiveText, leaveDisabled && styles.disabledText]}
              >
                나가기
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    right: 16,
  },
  menu: {
    width: 96,
    backgroundColor: C.card,
    borderRadius: Radius.xs,
    padding: 8,
    gap: 6,
    ...Shadow.lg,
  },
  row: {
    paddingVertical: 2,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    ...Typography.body2Medium,
    color: Gray[900],
  },
  destructiveText: {
    color: Magenta[300],
  },
  disabledText: {
    opacity: 0.4,
  },
  divider: {
    height: 1,
    width: 80,
    backgroundColor: C.divider,
  },
})
