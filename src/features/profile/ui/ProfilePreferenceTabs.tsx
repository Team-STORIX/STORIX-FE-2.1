import { Pressable, StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { C, Gray , Typography } from '../../../theme'

export type ProfilePreferenceTab = 'analysis' | 'activity'

type Props = {
  activeTab?: ProfilePreferenceTab
  onChangeTab?: (tab: ProfilePreferenceTab) => void
}

export function ProfilePreferenceTabs({ activeTab, onChangeTab }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const derivedTab: ProfilePreferenceTab =
    pathname.startsWith('/profile/my-activity') ? 'activity' : 'analysis'
  const currentTab = activeTab ?? derivedTab

  const handlePress = (nextTab: ProfilePreferenceTab) => {
    if (currentTab === nextTab) return

    if (onChangeTab) {
      onChangeTab(nextTab)
      return
    }

    if (nextTab === 'analysis') {
      router.push('/(tabs)/profile')
      return
    }

    router.push('/profile/my-activity')
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => handlePress('analysis')} style={styles.tab}>
        <Text
          style={[
            styles.tabLabel,
            currentTab === 'analysis' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          취향 분석
        </Text>
        <View
          style={[
            styles.tabIndicator,
            currentTab === 'analysis' ? styles.tabIndicatorActive : styles.tabIndicatorInactive,
          ]}
        />
      </Pressable>

      <Pressable onPress={() => handlePress('activity')} style={styles.tab}>
        <Text
          style={[
            styles.tabLabel,
            currentTab === 'activity' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          내 활동
        </Text>
        <View
          style={[
            styles.tabIndicator,
            currentTab === 'activity' ? styles.tabIndicatorActive : styles.tabIndicatorInactive,
          ]}
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: C.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  tabLabel: {
    ...Typography.body1Medium,
  },
  tabLabelActive: {
    color: C.text,
  },
  tabLabelInactive: {
    color: Gray[400],
  },
  tabIndicator: {
    height: 2,
    alignSelf: 'stretch',
  },
  tabIndicatorActive: {
    backgroundColor: C.text,
  },
  tabIndicatorInactive: {
    backgroundColor: 'transparent',
  },
})
