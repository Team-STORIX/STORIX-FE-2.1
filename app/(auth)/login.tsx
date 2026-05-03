import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useNativeSocialLogin,
  developerLogin,
  AuthHeader,
  SocialLoginButton,
} from '../../src/features/auth'
import { useAuthStore } from '../../src/store/auth.store'
import { C } from '../../src/theme/colors'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const mutation = useNativeSocialLogin()
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens)

  const pending = mutation.isPending
  const pendingProvider = mutation.variables // 'kakao' | 'naver' | undefined

  // ── Dev login (DEV builds only) ────────────────────────────────────────────
  const handleDevLogin = async () => {
    try {
      const res = await developerLogin('dev')
      await setLoginTokens({ accessToken: res.result.accessToken })
    } catch (e) {
      console.error('[DEV login] failed:', e)
    }
  }

  // ── Error message ──────────────────────────────────────────────────────────
  // Keep generic — provider-specific messages (e.g. Kakao key hash) are not
  // detectable cleanly at this layer without coupling to native SDK internals.
  const errorMsg = mutation.isError
    ? pendingProvider === 'kakao'
      ? '카카오 로그인에 실패했습니다.\n키 해시 설정을 확인해주세요.'
      : '로그인에 실패했습니다. 다시 시도해주세요.'
    : null

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <View style={styles.heroArea}>
        <AuthHeader />
      </View>

      {/* ── Social login buttons ───────────────────────────────────────────── */}
      <View style={styles.buttonsArea}>
        {/* Kakao */}
        <SocialLoginButton
          label="카카오로 로그인"
          icon="💬"
          backgroundColor="#FEE500"
          textColor="#000000"
          spinnerColor="#3C1E1E"
          onPress={() => mutation.mutate('kakao')}
          isLoading={pending && pendingProvider === 'kakao'}
          disabled={pending && pendingProvider !== 'kakao'}
        />

        {/* Naver */}
        <SocialLoginButton
          label="네이버로 로그인"
          icon="🟢"
          backgroundColor="#03C75A"
          textColor="#ffffff"
          onPress={() => mutation.mutate('naver')}
          isLoading={pending && pendingProvider === 'naver'}
          disabled={pending && pendingProvider !== 'naver'}
        />

        {/* Apple — TODO: wire @invertase/react-native-apple-authentication */}
        <SocialLoginButton
          label="Apple로 로그인 (준비 중)"
          icon="🍎"
          backgroundColor="#000000"
          textColor="#ffffff"
          onPress={() => {}}
          disabled
        />

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Dev login — __DEV__ builds only */}
        {__DEV__ ? (
          <View style={styles.devSection}>
            <View style={styles.devDivider} />
            <SocialLoginButton
              label="[DEV] Developer Login"
              backgroundColor={C.textMuted}
              textColor="#ffffff"
              onPress={handleDevLogin}
              disabled={pending}
            />
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.card,
    paddingHorizontal: 28,
  },

  heroArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 160,
  },

  buttonsArea: {
    gap: 12,
    paddingBottom: 8,
  },

  errorBox: {
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: C.error,
    textAlign: 'center',
    lineHeight: 19,
  },

  devSection: { gap: 10, marginTop: 8 },
  devDivider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 2,
  },
})
