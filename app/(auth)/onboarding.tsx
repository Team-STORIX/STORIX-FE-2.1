import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AuthHeader } from '../../src/components/auth/AuthHeader'
import { C } from '../../src/theme/colors'
import { Radius } from '../../src/theme/radius'

// TODO(Phase onboarding): Implement the full signup onboarding flow:
//   Step 1 — nickname input + duplicate check (useCheckNicknameValid)
//   Step 2 — genre selection (GenreKey enum from auth.schema.ts)
//   Step 3 — works swipe preference (usePreference hooks)
//   Step 4 — final confirmation → useSignup → navigate to /(tabs)

const UPCOMING_STEPS = [
  '닉네임 설정',
  '좋아하는 장르 선택',
  '작품 취향 설정',
  '가입 완료',
] as const

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <AuthHeader tagline="거의 다 왔어요!" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>회원가입 플로우 준비 중</Text>
        <Text style={styles.cardBody}>
          더 나은 경험을 위해 온보딩 화면을 준비하고 있습니다.{'\n'}
          곧 아래 단계들이 순서대로 제공될 예정입니다.
        </Text>

        <View style={styles.stepList}>
          {UPCOMING_STEPS.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },

  card: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },

  stepList: { gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: 12, fontWeight: '800', color: C.primary },
  stepLabel: { fontSize: 14, color: C.text, fontWeight: '500' },
})
