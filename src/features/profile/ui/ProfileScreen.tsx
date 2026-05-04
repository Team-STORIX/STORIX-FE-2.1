import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme'
import { useMe } from '../hooks'
import { ProfileHashtagSection } from './ProfileHashtagSection'
import { ProfilePreferenceSection } from './ProfilePreferenceSection'
import { ProfilePreferenceTabs } from './ProfilePreferenceTabs'
import { ProfileRatingSection } from './ProfileRatingSection'
import { ProfileTopBar } from './ProfileTopBar'
import { ProfileUserSummary } from './ProfileUserSummary'

export function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data: me, isLoading, isError } = useMe()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (isError || !me) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>프로필을 불러오지 못했어요.</Text>
        <Text style={styles.errorHint}>잠시 후 다시 시도해주세요.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ paddingTop: insets.top }}>
        <ProfileTopBar onPressSettings={() => router.push('/profile/settings')} />
      </View>

      <ProfileUserSummary me={me} />
      <ProfilePreferenceTabs />
      <ProfilePreferenceSection />
      <ProfileRatingSection />
      <ProfileHashtagSection />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: C.card,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: C.card,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    color: C.error,
  },
  errorHint: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: Gray[500],
  },
})
