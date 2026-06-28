import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Typography } from '../../../theme'

type DeleteTargetType = 'comment' | 'post'

type FeedDeleteConfirmModalProps = {
  visible: boolean
  type: DeleteTargetType
  onClose: () => void
  onConfirm: () => Promise<void>
}

const COPY = {
  comment: {
    title: '댓글 삭제',
    description: '정말 댓글을 삭제하시겠습니까?',
  },
  post: {
    title: '피드글 삭제',
    description: '정말 피드글을 삭제하시겠습니까?',
  },
} as const

export function FeedDeleteConfirmModal({
  visible,
  type,
  onClose,
  onConfirm,
}: FeedDeleteConfirmModalProps) {
  const [confirming, setConfirming] = useState(false)
  const copy = COPY[type]

  const handleConfirm = async () => {
    if (confirming) return
    setConfirming(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose}>
          <Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.description}>{copy.description}</Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onClose}
                disabled={confirming}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => void handleConfirm()}
                disabled={confirming}
              >
                <Text style={styles.confirmButtonText}>삭제</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: 306,
    height: 173,
    backgroundColor: C.card,
    borderRadius: 8,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: Gray[900],
    textAlign: 'center',
  },
  description: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 23,
  },
  cancelButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body1Medium,
    color: Gray[700],
  },
  confirmButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: Gray[900],
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  buttonPressed: {
    opacity: 0.8,
  },
})
