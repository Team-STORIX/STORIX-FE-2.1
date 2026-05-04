import { Pressable, StyleSheet, Text, View } from 'react-native'

const PROFILE_TAB_ACTIVE = '#100F0F'
const PROFILE_TAB_INACTIVE = '#A9A8A8'

export function ProfilePreferenceTabs() {
  return (
    <View style={styles.container}>
      <Pressable disabled style={styles.tab}>
        <Text style={[styles.tabLabel, styles.tabLabelActive]}>취향 분석</Text>
        <View style={[styles.tabIndicator, styles.tabIndicatorActive]} />
      </Pressable>

      <Pressable disabled style={styles.tab}>
        <Text style={[styles.tabLabel, styles.tabLabelInactive]}>내 활동</Text>
        <View style={[styles.tabIndicator, styles.tabIndicatorInactive]} />
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
