import { Pressable, StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { C, Gray, Typography } from '../../../theme'

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
      <Pressable
        onPress={() => handlePress('analysis')}
        style={[styles.tab, currentTab === 'analysis' ? styles.tabActive : styles.tabInactive]}
      >
        <Text style={[styles.tabLabel, currentTab === 'analysis' ? styles.tabLabelActive : styles.tabLabelInactive]}>
          취향 분석
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handlePress('activity')}
        style={[styles.tab, currentTab === 'activity' ? styles.tabActive : styles.tabInactive]}
      >
        <Text style={[styles.tabLabel, currentTab === 'activity' ? styles.tabLabelActive : styles.tabLabelInactive]}>
          내 활동
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: C.card,
  },
  tab: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  tabActive: {
    borderBottomColor: C.text,
  },
  tabInactive: {
    borderBottomColor: Gray[200],
  },
  tabLabel: {
    ...Typography.body1Medium,
    lineHeight: 22.4,
  },
  tabLabelActive: {
    color: C.text,
  },
  tabLabelInactive: {
    color: Gray[400],
  },
})
