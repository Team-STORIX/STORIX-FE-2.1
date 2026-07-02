import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Magenta, Typography } from '../../../theme'

type TitleInfoModalProps = {
  visible: boolean
  onClose: () => void
  stage: string | null
  topGenre: string | null
  title: string | null
}

export function TitleInfoModal({ visible, onClose, stage, topGenre, title }: TitleInfoModalProps) {
  const stageLabel = stage?.replace(/\s*단계$/, '') || '미진입'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* 타이틀 */}
          <Text style={styles.title}>칭호는 어떻게 정해지나요?</Text>

          {/* 현재 단계 */}
          <View style={[styles.infoRow, styles.firstInfoRow]}>
            <View style={styles.labelChip}>
              <Text style={styles.labelText}>현재 단계</Text>
            </View>
            <Text style={styles.valueText}>
              {stageLabel}
            </Text>
          </View>

          {/* 대표 장르 */}
          <View style={styles.infoRow}>
            <View style={styles.labelChip}>
              <Text style={styles.labelText}>대표 장르</Text>
            </View>
            <Text style={styles.valueText}>
              {topGenre || '아직 대표 장르가 정해지지 않았어요!'}
            </Text>
          </View>

          {/* 적용 칭호 */}
          <View style={styles.infoRow}>
            <View style={styles.labelChip}>
              <Text style={styles.labelText}>적용 칭호</Text>
            </View>
            <Text style={styles.valueText}>{title || '아직 칭호가 정해지지 않았어요!'}</Text>
          </View>

          {/* 안내 문구 */}
          <Text style={styles.notice}>
            칭호는 활동점수가 가장 높은 장르를 기준으로 정해져요.{'\n'}
            토픽룸 참여, 리뷰·게시물 작성, 관심 작품 등록을 통해 {'\n'}
            장르 점수가 쌓이면 <Text style={styles.noticeStrong}>입문-탐색-몰입</Text> 단계로 성장합니다.{'\n'}
            다음 칭호는 획득시 공개돼요.
          </Text>

          {/* 확인 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && styles.confirmButtonPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.confirmButtonText}>확인</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
  modal: {
    width: 306,
    backgroundColor: C.card,
    borderRadius: 8,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'left',
  },
  description: {
    ...Typography.caption1Medium,
    color: Gray[500],
    marginTop: 4,
    textAlign: 'left',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  firstInfoRow: {
    marginTop: 16,
  },
  labelChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: Magenta[300],
  },
  labelText: {
    ...Typography.caption1Extrabold,
    color: C.card, // white
  },
  valueText: {
    ...Typography.caption1Semibold,
    color: Magenta[300],
    flex: 1,
  },
  notice: {
    ...Typography.caption1Medium,
    color: Gray[500],
    marginTop: 16,
    textAlign: 'left',
  },
  noticeStrong: {
    ...Typography.caption1Semibold,
    color: Magenta[300],
  },
  confirmButton: {
    height: 49,
    marginTop: 28,
    backgroundColor: Gray[900],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.8,
  },
  confirmButtonText: {
    ...Typography.body1Medium,
    color: C.card, // white
  },
})
