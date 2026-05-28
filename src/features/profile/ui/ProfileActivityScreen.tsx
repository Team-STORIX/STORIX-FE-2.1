import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { useMe } from '../hooks'
import { ProfileActivityContent } from './ProfileActivityContent'
import { ProfilePreferenceTabs } from './ProfilePreferenceTabs'
import { ProfileTopBar } from './ProfileTopBar'
import { ProfileUserSummary } from './ProfileUserSummary'
import { type ProfileActivityTab } from './ProfileActivityTabs'

const TAB_VALUES: ProfileActivityTab[] = ['posts', 'comments', 'likes']

const isActivityTab = (value: string | string[] | undefined): value is ProfileActivityTab =>
  typeof value === 'string' && TAB_VALUES.includes(value as ProfileActivityTab)

export function ProfileActivityScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{ tab?: string }>()
  const [activeTab, setActiveTab] = useState<ProfileActivityTab>(() =>
    isActivityTab(params.tab) ? params.tab : 'posts',
  )

  const { data: me, isLoading: meLoading, isError: meError } = useMe()

  if (meLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Magenta[300]} />
      </View>
    )
  }

  if (meError || !me) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>프로필을 불러오지 못했습니다.</Text>
        <Text style={styles.errorHint}>다시 한번 시도해주세요.</Text>
      </View>
    )
  }

  return (
    <ProfileActivityContent
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      currentUserId={me.userId}
      bottomInset={insets.bottom}
      header={
        <>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={{ paddingTop: insets.top }}>
            <ProfileTopBar onPressSettings={() => router.push('/profile/settings')} />
          </View>
          <ProfileUserSummary me={me} />
          <ProfilePreferenceTabs />
        </>
      }
    />
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: C.card,
  },
  errorText: {
    ...Typography.body1Medium,
    color: Gray[900],
  },
  errorHint: {
    marginTop: 6,
    ...Typography.caption1Medium,
    color: Gray[500],
  },
})
