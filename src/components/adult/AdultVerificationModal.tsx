import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { C, Gray, Typography } from '../../theme'
import type { AdultVerificationContext } from '../../store/adultVerification.store'
import { AdultBadge } from './AdultBadge'

/** First line of the body per entry point; the second line is shared. */
const CONTEXT_LEAD: Record<AdultVerificationContext, string> = {
  read: '게시글 접근을 위해 성인인증이 필요합니다.',
  topicroom: '해당 토픽룸 접근을 위해 성인인증이 필요합니다.',
  writeReview: '리뷰 작성을 위해 성인인증이 필요합니다.',
  writePost: '게시글 작성을 위해 성인인증이 필요합니다.',
}

export const getAdultVerificationModalBody = (
  context: AdultVerificationContext,
): string => `${CONTEXT_LEAD[context]}\n성인 인증 후 이용해주세요.`

type AdultVerificationModalProps = {
  visible: boolean
  context: AdultVerificationContext
  /** Overrides the context copy when a screen needs its own wording. */
  description?: string
  onConfirm: () => void
  onClose: () => void
}

/** "연령 제한 콘텐츠" popup (Figma 11287:48332). Backdrop tap closes it. */
export function AdultVerificationModal({
  visible,
  context,
  description,
  onConfirm,
  onClose,
}: AdultVerificationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <AdultBadge size={20} />
              <Text style={styles.title}>연령 제한 콘텐츠</Text>
            </View>
            <Text style={styles.body}>
              {description ?? getAdultVerificationModalBody(context)}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonLabel}>성인 인증하기</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
  },
  card: {
    width: 306,
    gap: 28,
    paddingTop: 28,
    paddingBottom: 16,
    borderRadius: 8,
    backgroundColor: C.card,
  },
  copy: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.heading2,
    color: Gray[900],
  },
  body: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 16,
  },
  button: {
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Gray[900],
  },
  buttonLabel: {
    ...Typography.body1Medium,
    color: C.card,
  },
  pressed: {
    opacity: 0.7,
  },
})
