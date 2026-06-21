import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Magenta, Typography } from '../../../theme'

type TitleAchievementModalProps = {
  visible: boolean
  onClose: () => void
  title: string
  genre: string
}

export function TitleAchievementModal({
  visible,
  onClose,
  title,
  genre,
}: TitleAchievementModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* 칭호명 */}
          <Text style={styles.title}>{title}</Text>

          {/* "칭호를 획득하였습니다!" */}
          <Text style={styles.subtitle}>칭호를 획득하였습니다!</Text>

          {/* 장르 아이콘 (80x80) */}
          <View style={styles.iconContainer}>
            {/* TODO: 장르별 SVG 아이콘 추가 */}
            <View style={styles.iconPlaceholder}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          </View>

          {/* 설명 */}
          <Text style={styles.description}>
            모든 칭호는 활동 점수가{'\n'}가장 높은 장르에 기반해 부여됩니다.
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
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    color: Magenta[300],
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'center',
    marginTop: 2,
  },
  iconContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Gray[100],
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreText: {
    ...Typography.body2Bold,
    color: '#010101',
  },
  description: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
    marginTop: 16,
  },
  confirmButton: {
    height: 49,
    width: '100%',
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
    color: C.card,
  },
})
