import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useNativeSocialLogin } from '../../src/hooks/auth/useNativeSocialLogin'
import { useAuthStore } from '../../src/store/auth.store'
import { developerLogin } from '../../src/lib/api/auth/developer-login.api'

export default function LoginScreen() {
  const mutation = useNativeSocialLogin()
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens)

  // Dev-only shortcut: calls the developer login endpoint.
  // Requires a valid pendingId from the backend team.
  const handleDevLogin = async () => {
    try {
      const res = await developerLogin('dev')
      await setLoginTokens({ accessToken: res.result.accessToken })
    } catch (e) {
      console.error('[DEV login] failed:', e)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>STORIX</Text>
      <Text style={styles.subtitle}>Login</Text>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.kakao]}
          onPress={() => mutation.mutate('kakao')}
          disabled={mutation.isPending}
        >
          <Text style={styles.kakaoText}>카카오로 로그인</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.naver]}
          onPress={() => mutation.mutate('naver')}
          disabled={mutation.isPending}
        >
          <Text style={styles.lightText}>네이버로 로그인</Text>
        </Pressable>

        {/* Apple Sign In — TODO(Phase native-login): wire @invertase/react-native-apple-authentication */}
        <Pressable style={[styles.button, styles.apple]} disabled>
          <Text style={styles.lightText}>Apple로 로그인 (준비 중)</Text>
        </Pressable>
      </View>

      {mutation.isPending && (
        <ActivityIndicator style={styles.loader} size="small" />
      )}

      {mutation.isError && (
        <Text style={styles.error}>
          로그인에 실패했습니다. 다시 시도해주세요.
        </Text>
      )}

      {/* Developer login — only rendered in __DEV__ builds */}
      {__DEV__ && (
        <Pressable style={[styles.button, styles.dev]} onPress={handleDevLogin}>
          <Text style={styles.lightText}>[DEV] Developer Login</Text>
        </Pressable>
      )}
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
  title: { fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 48 },
  buttons: { width: '100%', gap: 12 },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  kakao: { backgroundColor: '#FEE500' },
  naver: { backgroundColor: '#03C75A' },
  apple: { backgroundColor: '#000', opacity: 0.35 },
  dev: { backgroundColor: '#666', marginTop: 40 },
  kakaoText: { fontSize: 15, fontWeight: '600', color: '#000' },
  lightText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  loader: { marginTop: 20 },
  error: { marginTop: 16, color: '#d00', fontSize: 13 },
})
