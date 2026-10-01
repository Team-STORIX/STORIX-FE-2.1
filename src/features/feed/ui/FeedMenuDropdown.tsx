import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Typography } from '../../../theme'

const commentDropdown = require('../../../../assets/icons/common/comment-dropdown.svg')

export type MenuPosition = { top: number; right: number }

type Props = {
  visible: boolean
  position: MenuPosition
  isMine: boolean
  onClose: () => void
  onDelete?: () => void
  onReport?: () => void
  onBlock?: () => void
}

/** "⋯" menu shared by posts and comments: 삭제하기 for the author, 신고/차단 otherwise. */
export function FeedMenuDropdown({
  visible,
  position,
  isMine,
  onClose,
  onDelete,
  onReport,
  onBlock,
}: Props) {
  if (!visible) return null

  const run = (action?: () => void) => () => {
    onClose()
    action?.()
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
        <View style={[styles.dropdown, position]}>
          {isMine ? (
            <Pressable style={styles.deleteItem} onPress={run(onDelete)}>
              <Text style={styles.deleteText}>삭제하기</Text>
            </Pressable>
          ) : (
            <View style={styles.reportBlock}>
              <Image source={commentDropdown} style={styles.reportBlockImage} contentFit="contain" />
              <Pressable style={[styles.half, styles.topHalf]} onPress={run(onReport)} />
              <Pressable style={[styles.half, styles.bottomHalf]} onPress={run(onBlock)} />
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: C.card,
    shadowColor: C.text,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  deleteItem: {
    width: 96,
    padding: 8,
    alignItems: 'flex-start',
  },
  deleteText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  reportBlock: {
    width: 96,
    height: 68,
    borderRadius: 4,
    overflow: 'hidden',
  },
  reportBlockImage: {
    position: 'absolute',
    top: -6,
    left: -8,
    width: 112,
    height: 84,
  },
  half: {
    position: 'absolute',
    left: 0,
    width: 96,
    height: 34,
  },
  topHalf: { top: 0 },
  bottomHalf: { top: 34 },
})
