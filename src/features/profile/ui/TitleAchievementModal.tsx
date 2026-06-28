import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { GENRE_SVG, normalizeGenreKey } from './ProfilePreferGenreSection'

type TitleAchievementModalProps = {
  visible: boolean
  onClose: () => void
  title: string
  nickname: string
  topGenre?: string | null
}

export function TitleAchievementModal({
  visible,
  onClose,
  title,
  nickname,
  topGenre,
}: TitleAchievementModalProps) {
  const genreKey = topGenre ? normalizeGenreKey(topGenre) : null
  const genreSvg = genreKey ? GENRE_SVG[genreKey] : null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>
            <Text style={styles.highlight}>{nickname}</Text> 님의 칭호가
          </Text>
          <Text style={styles.subtitle}>
            <Text style={styles.highlight}>{title}</Text>로 변경되었습니다!
          </Text>

          {genreSvg ? (
            <View style={styles.logo}>
              <SvgXml xml={genreSvg} width={80} height={80} />
            </View>
          ) : null}

          <Text style={styles.description}>
            모든 칭호는 활동 점수가{'\n'}가장 높은 장르에 기반해 부여됩니다.
          </Text>

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
    fontFamily: 'SUITBold',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25.2,
    color: Gray[900],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SUITBold',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25.2,
    color: Gray[900],
    textAlign: 'center',
    marginTop: 0,
  },
  highlight: {
    color: Magenta[300],
  },
  logo: {
    width: 80,
    height: 80,
    marginTop: 16,
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
