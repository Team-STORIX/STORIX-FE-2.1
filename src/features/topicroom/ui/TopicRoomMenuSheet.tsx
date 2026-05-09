import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Radius, Typography } from '../../../theme'

type Props = {
  visible: boolean
  onClose: () => void
  onPressReport: () => void
  onPressLeave: () => void
  reportDisabled?: boolean
  leaveDisabled?: boolean
}

export function TopicRoomMenuSheet({
  visible,
  onClose,
  onPressReport,
  onPressLeave,
  reportDisabled = false,
  leaveDisabled = false,
}: Props) {
  const insets = useSafeAreaInsets()

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
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

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelRow,
              pressed && styles.rowPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: 4,
  },
  row: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  rowPressed: {
    backgroundColor: Gray[100],
  },
  rowText: {
    ...Typography.body1Medium,
    color: C.text,
  },
  destructiveText: {
    color: C.error,
  },
  disabledText: {
    opacity: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginHorizontal: 20,
  },
  cancelRow: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: Gray[50],
  },
  cancelText: {
    ...Typography.body1Semibold,
    color: C.textSecondary,
  },
})
