import { View, Text, StyleSheet } from 'react-native'

// TODO(Phase onboarding): Implement the full signup onboarding flow:
//   Step 1 — nickname input + duplicate check (useCheckNicknameValid)
//   Step 2 — genre selection (GenreKey enum from auth.schema.ts)
//   Step 3 — works swipe preference (usePreference hooks)
//   Step 4 — final confirmation → useSignup → navigate to (tabs)

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>온보딩</Text>
      <Text style={styles.body}>
        회원가입 플로우 준비 중입니다.{'\n'}
        (닉네임 · 장르 · 작품 선택 · 최종 가입)
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  body: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 24 },
})
