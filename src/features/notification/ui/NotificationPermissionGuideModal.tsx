import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { C, Gray } from '../../../theme'

type Props = {
  visible: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
}

/** Shared Figma 8489:29739 notification-settings guide modal. */
export function NotificationPermissionGuideModal({
  visible,
  message,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>알림 설정</Text>
          <Text style={styles.modalBody}>{message}</Text>
          <View style={styles.modalButtons}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="알림 설정 취소"
            >
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="알림 설정 확인"
            >
              <Text style={styles.confirmLabel}>확인</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 306,
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: 'flex-start',
    borderRadius: 8,
    backgroundColor: C.card,
  },
  modalTitle: {
    paddingHorizontal: 24,
    fontFamily: 'SUIT',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: C.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalBody: {
    marginTop: 4,
    paddingHorizontal: 24,
    fontFamily: 'SUIT',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: Gray[500],
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalButtons: {
    marginTop: 28,
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLabel: {
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: Gray[700],
  },
  confirmButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: C.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLabel: {
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: C.card,
  },
  pressed: {
    opacity: 0.7,
  },
})
