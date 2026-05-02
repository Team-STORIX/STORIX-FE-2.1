import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useMe } from '../../src/hooks/profile/useMe'
import { logoutUser } from '../../src/lib/api/auth/logout.api'
import { useAuthStore } from '../../src/store/auth.store'

// TODO(Phase profile): Replace this debug screen with the final profile UI.

export default function ProfileScreen() {
  const { data: me, isLoading, isError, error } = useMe()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Best-effort server-side session invalidation.
      // If the request fails (token already expired, network error, etc.)
      // we still clear local state so the user is signed out.
      await logoutUser()
    } catch {
      // Intentionally swallowed — local sign-out proceeds regardless.
    } finally {
      // clearAuth() wipes SecureStore + Zustand + calls resetToLogin().
      await useAuthStore.getState().clearAuth()
      // setIsLoggingOut(false) is not called because navigation will
      // unmount this screen before the state update would render.
    }
  }

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: handleLogout },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>프로필</Text>

      {isLoading && <ActivityIndicator style={styles.loader} />}

      {me && !isLoading && (
        <View style={styles.card}>
          <Row label="userId" value={String(me.userId)} />
          <Row label="nickName" value={me.nickName} />
          <Row label="role" value={me.role} />
          <Row label="level" value={String(me.level)} />
          <Row label="point" value={String(me.point)} />
        </View>
      )}

      {isError && (
        <Text style={styles.error}>
          프로필을 불러오지 못했습니다.{'\n'}
          {error instanceof Error ? error.message : String(error)}
        </Text>
      )}

      <Pressable
        style={[styles.logoutButton, isLoggingOut && styles.logoutDisabled]}
        onPress={confirmLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.logoutText}>로그아웃</Text>
        )}
      </Pressable>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  loader: { marginTop: 32 },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  rowLabel: { fontSize: 13, color: '#888' },
  rowValue: { fontSize: 14, fontWeight: '500' },
  error: { color: '#c00', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  logoutButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutDisabled: { opacity: 0.5 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
