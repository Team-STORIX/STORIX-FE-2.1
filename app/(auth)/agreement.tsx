import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../src/store/auth.store'

export default function AgreementScreen() {
  const router = useRouter()
  const setMarketingAgree = useAuthStore((s) => s.setMarketingAgree)
  const [marketingChecked, setMarketingChecked] = useState(false)

  const handleConfirm = async () => {
    await setMarketingAgree(marketingChecked)
    // Navigate to the onboarding flow.
    router.replace('/(auth)/onboarding')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>이용약관 동의</Text>
      <Text style={styles.body}>
        STORIX 서비스 이용을 위해 아래 약관에 동의해주세요.
      </Text>

      {/* TODO: add full terms text and required-agreement checkboxes */}

      <Pressable
        style={styles.checkRow}
        onPress={() => setMarketingChecked((v) => !v)}
      >
        <View style={[styles.checkbox, marketingChecked && styles.checked]} />
        <Text style={styles.checkLabel}>마케팅 정보 수신 동의 (선택)</Text>
      </Pressable>

      <Pressable style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>동의하고 시작하기</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  body: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 36 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#bbb',
    borderRadius: 4,
    marginRight: 10,
  },
  checked: { backgroundColor: '#222', borderColor: '#222' },
  checkLabel: { fontSize: 15, color: '#333' },
  confirmButton: {
    backgroundColor: '#222',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
