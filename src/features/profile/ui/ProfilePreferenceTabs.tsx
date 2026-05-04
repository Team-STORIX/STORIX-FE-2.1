import { Pressable, StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'

const PROFILE_TAB_ACTIVE = '#100F0F'
const PROFILE_TAB_INACTIVE = '#A9A8A8'

export function ProfilePreferenceTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const isAnalysisTab = pathname === '/profile' || pathname === '/(tabs)/profile'
  const isActivityTab = pathname.startsWith('/profile/my-activity')

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          if (!isAnalysisTab) router.push('/(tabs)/profile')
        }}
        style={styles.tab}
      >
        <Text style={[styles.tabLabel, isAnalysisTab ? styles.tabLabelActive : styles.tabLabelInactive]}>
          취향 분석
        </Text>
        <View style={[styles.tabIndicator, isAnalysisTab ? styles.tabIndicatorActive : styles.tabIndicatorInactive]} />
      </Pressable>

      <Pressable
        onPress={() => {
          if (!isActivityTab) router.push('/profile/my-activity')
        }}
        style={styles.tab}
      >
        <Text style={[styles.tabLabel, isActivityTab ? styles.tabLabelActive : styles.tabLabelInactive]}>
          내 활동
        </Text>
        <View style={[styles.tabIndicator, isActivityTab ? styles.tabIndicatorActive : styles.tabIndicatorInactive]} />
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
