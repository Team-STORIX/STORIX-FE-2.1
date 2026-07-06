import { Image } from 'expo-image'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Radius, Typography } from '../../../theme'
import { MAX_JOINED_TOPIC_ROOMS } from '../services/topicRoomLimit'

const warningIcon = require('../../../../assets/icons/search/warning.png')

type Props = {
  visible: boolean
  onClose: () => void
}

export function TopicRoomLimitModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.content}>
            <Image source={warningIcon} style={styles.icon} contentFit="contain" />

            <View style={styles.textGroup}>
              <Text style={styles.title}>최대 토픽룸 개수 초과</Text>
              <Text style={styles.description}>
                동시에 참여 가능한 토픽룸은{' '}
                <Text style={styles.descriptionBold}>
                  최대 {MAX_JOINED_TOPIC_ROOMS}개
                </Text>
                입니다.{'\n'}
                현재 참여중인 토픽룸에서 퇴장한 뒤{'\n'}
                다시 시도해 주세요.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.confirmText}>확인</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 17, 18, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 306,
    borderRadius: Radius.sm,
    backgroundColor: C.card,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: C.black,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  icon: {
    width: 80,
    height: 80,
  },
  textGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'center',
  },
  description: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  descriptionBold: {
    ...Typography.body2Bold,
    color: Gray[500],
  },
  confirmBtn: {
    width: '100%',
    height: 49,
    borderRadius: Radius.sm,
    backgroundColor: Gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  confirmText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  pressed: {
    opacity: 0.8,
  },
})
