import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { logoutUser } from '../../src/lib/api/auth/logout.api'
import { useAuthStore } from '../../src/store/auth.store'
import {
  useMe,
  ProfileHeader,
  ProfileStatCard,
  ProfileMenuItem,
} from '../../src/features/profile'
import { C } from '../../src/theme/colors'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { data: me, isLoading, isError } = useMe()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutUser()
    } catch {
      // Best-effort — local sign-out always proceeds
    } finally {
      await useAuthStore.getState().clearAuth()
      // Screen unmounts on clearAuth → navigation reset; no need to flip flag
    }
  }

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: handleLogout },
    ])
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '프로필' }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !me) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '프로필' }} />
        <Text style={styles.errorText}>프로필을 불러오지 못했습니다.</Text>
        <Text style={styles.errorHint}>잠시 후 다시 시도해주세요.</Text>
      </View>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: '프로필' }} />

      {/* Avatar + name + role + description */}
      <ProfileHeader me={me} />

      {/* Level + Point stats */}
      <ProfileStatCard
        stats={[
          { label: '레벨', value: me.level },
          { label: '포인트', value: me.point.toLocaleString() },
        ]}
      />

      {/* Activity menu */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>활동</Text>
        <View style={styles.menuGroup}>
          {/* TODO: navigate to my reviews screen */}
          <ProfileMenuItem label="내 리뷰" isFirst isLast={false} />
          {/* TODO: navigate to favorites screen */}
          <ProfileMenuItem label="즐겨찾기" isFirst={false} isLast />
        </View>
      </View>

      {/* Settings menu */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>기타</Text>
        <View style={styles.menuGroup}>
          {/* TODO: navigate to settings screen */}
          <ProfileMenuItem label="설정" isFirst isLast />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <View style={styles.menuGroup}>
          <ProfileMenuItem
            label={isLoggingOut ? '로그아웃 중…' : '로그아웃'}
            onPress={confirmLogout}
            disabled={isLoggingOut}
            destructive
            isFirst
            isLast
          />
        </View>
      </View>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: C.bg,
  },
  errorText: { fontSize: 15, color: C.error, marginBottom: 6 },
  errorHint: { fontSize: 13, color: C.textMuted },

  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  menuGroup: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
})
