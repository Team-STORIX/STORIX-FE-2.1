import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import { C, Gray } from '../../../theme'
import { useAdultVerificationStore } from '../../../store/adultVerification.store'

// Shown when any API answers 403 ADULT_VERIFICATION_ERROR_008. Mounted once at
// the root so every screen shares it; the axios interceptor raises it.
// Placeholder visuals until the design is final.
export function AdultVerificationRequiredModal() {
  const router = useRouter()
  const visible = useAdultVerificationStore((state) => state.promptVisible)
  const hidePrompt = useAdultVerificationStore((state) => state.hidePrompt)

  const startVerification = () => {
    hidePrompt()
    router.push('/profile/adult-verification' as never)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={hidePrompt}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>성인인증이 필요해요</Text>
          <Text style={styles.body}>
            이 콘텐츠는 성인인증을 완료한 후 이용할 수 있어요.
          </Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={hidePrompt}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelLabel}>닫기</Text>
            </Pressable>
            <Pressable
              onPress={startVerification}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.confirmLabel}>인증하기</Text>
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
  box: {
    width: 306,
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: 'flex-start',
    borderRadius: 8,
    backgroundColor: C.card,
  },
  title: {
    paddingHorizontal: 24,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: C.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  body: {
    marginTop: 10,
    paddingHorizontal: 24,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    color: Gray[500],
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  buttons: {
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
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: C.card,
  },
  pressed: {
    opacity: 0.7,
  },
})
