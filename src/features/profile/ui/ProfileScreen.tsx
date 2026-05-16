import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme'
import { useMe } from '../hooks'
import { ProfileActivityContent } from './ProfileActivityContent'
import { ProfileHashtagSection } from './ProfileHashtagSection'
import { ProfilePreferGenreSection } from './ProfilePreferGenreSection'
import { ProfilePreferenceSection } from './ProfilePreferenceSection'
import { ProfilePreferenceTabs, type ProfilePreferenceTab } from './ProfilePreferenceTabs'
import { ProfileRatingSection } from './ProfileRatingSection'
import { ProfileTopBar } from './ProfileTopBar'
import { ProfileUserSummary } from './ProfileUserSummary'
import type { ProfileActivityTab } from './ProfileActivityTabs'

export function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data: me, isLoading, isError } = useMe()
  const [activeTab, setActiveTab] = useState<ProfilePreferenceTab>('analysis')
  const [activeActivityTab, setActiveActivityTab] = useState<ProfileActivityTab>('posts')

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
        <Text style={styles.errorText}>프로필을 불러오지 못했습니다.</Text>
        <Text style={styles.errorHint}>다시 한번 시도해주세요.</Text>
      </View>
    )
  }

  if (activeTab === 'activity') {
    return (
      <ProfileActivityContent
        activeTab={activeActivityTab}
        onChangeTab={setActiveActivityTab}
        currentUserId={me.userId}
        bottomInset={insets.bottom}
        header={
          <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ paddingTop: insets.top }}>
              <ProfileTopBar onPressSettings={() => router.push('/profile/settings')} />
            </View>
            <ProfileUserSummary me={me} />
            <ProfilePreferenceTabs activeTab={activeTab} onChangeTab={setActiveTab} />
          </>
        }
      />
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
      <ProfilePreferenceTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      <ProfilePreferenceSection />
      <ProfileRatingSection />
      <ProfilePreferGenreSection />
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
