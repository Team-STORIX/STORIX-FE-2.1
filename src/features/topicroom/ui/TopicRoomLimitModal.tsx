import { StyleSheet, Text } from 'react-native'
import { WarningModal } from '../../../components/common/WarningModal'
import { Gray, Typography } from '../../../theme'
import { MAX_JOINED_TOPIC_ROOMS } from '../services/topicRoomLimit'

type Props = {
  visible: boolean
  onClose: () => void
}

export function TopicRoomLimitModal({ visible, onClose }: Props) {
  return (
    <WarningModal
      visible={visible}
      title="최대 토픽룸 개수 초과"
      description={
        <>
          동시에 참여 가능한 토픽룸은{' '}
          <Text style={styles.descriptionBold}>최대 {MAX_JOINED_TOPIC_ROOMS}개</Text>
          입니다.{'\n'}
          현재 참여중인 토픽룸에서 퇴장한 뒤{'\n'}
          다시 시도해 주세요.
        </>
      }
      onConfirm={onClose}
    />
  )
}

const styles = StyleSheet.create({
  descriptionBold: {
    ...Typography.body2Bold,
    color: Gray[500],
  },
})
