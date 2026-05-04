import { Pressable, StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'

const PROFILE_TAB_ACTIVE = '#100F0F'
const PROFILE_TAB_INACTIVE = '#A9A8A8'

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
          痍⑦뼢 遺꾩꽍
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
          ???쒕룞
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
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  tabLabelActive: {
    color: PROFILE_TAB_ACTIVE,
  },
  tabLabelInactive: {
    color: PROFILE_TAB_INACTIVE,
  },
  tabIndicator: {
    width: '100%',
    height: 2,
  },
  tabIndicatorActive: {
    backgroundColor: PROFILE_TAB_ACTIVE,
  },
  tabIndicatorInactive: {
    backgroundColor: PROFILE_TAB_INACTIVE,
  },
})
