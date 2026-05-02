import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../src/store/auth.store'
import { AuthHeader } from '../../src/components/auth/AuthHeader'
import { C } from '../../src/theme/colors'
import { Radius } from '../../src/theme/radius'

const REQUIRED_TERMS = [
  { id: 'tos',     label: '서비스 이용약관' },
  { id: 'privacy', label: '개인정보 처리방침' },
] as const

export default function AgreementScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const setMarketingAgree = useAuthStore((s) => s.setMarketingAgree)
  const [marketingChecked, setMarketingChecked] = useState(false)

  const handleConfirm = async () => {
    await setMarketingAgree(marketingChecked)
    router.replace('/(auth)/onboarding')
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.headerArea}>
          <AuthHeader tagline="서비스 이용을 시작하기 전에" />
        </View>

        {/* Required terms — informational; proceeding = acceptance */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>필수 동의</Text>
          <Text style={styles.sectionNote}>
            아래 약관은 서비스 이용에 필수적으로 동의가 필요합니다.
          </Text>
          <View style={styles.termsList}>
            {REQUIRED_TERMS.map((term) => (
              <View key={term.id} style={styles.termRow}>
                <Text style={styles.termCheck}>✓</Text>
                <Text style={styles.termLabel}>{term.label} (필수)</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Optional marketing consent */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>선택 동의</Text>
          <Pressable
            style={styles.checkRow}
            onPress={() => setMarketingChecked((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marketingChecked }}
          >
            <View
              style={[
                styles.checkbox,
                marketingChecked && styles.checkboxChecked,
              ]}
            >
              {marketingChecked ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </View>
            <View style={styles.checkLabelWrap}>
              <Text style={styles.checkLabel}>
                마케팅 정보 수신 동의 (선택)
              </Text>
              <Text style={styles.checkSubLabel}>
                신작 소식, 이벤트, 혜택 정보를 받아보실 수 있습니다.
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Confirm button — pinned to bottom */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && styles.confirmBtnPressed,
          ]}
          onPress={handleConfirm}
          accessibilityRole="button"
        >
          <Text style={styles.confirmText}>동의하고 시작하기</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.card,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  headerArea: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionNote: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },

  termsList: { gap: 8 },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  termCheck: {
    fontSize: 13,
    color: C.primary,
    fontWeight: '700',
    width: 16,
    textAlign: 'center',
  },
  termLabel: { fontSize: 14, color: C.text, fontWeight: '500' },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 8,
    marginBottom: 20,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: '800' },
  checkLabelWrap: { flex: 1 },
  checkLabel: { fontSize: 14, color: C.text, fontWeight: '500', lineHeight: 20 },
  checkSubLabel: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.card,
  },
  confirmBtn: {
    backgroundColor: C.primary,
    borderRadius: Radius.sm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnPressed: { opacity: 0.82 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
