import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray } from '../../../theme'

export type OtherUserProfileTab = 'analysis' | 'library'

const TABS: { key: OtherUserProfileTab; label: string }[] = [
  { key: 'analysis', label: '취향 분석' },
  { key: 'library', label: '서재' },
]

type Props = {
  activeTab: OtherUserProfileTab
  onChangeTab: (tab: OtherUserProfileTab) => void
  /** Shown as "서재 (n)"; omitted while unknown or when the library is private. */
  libraryCount?: number
}

/** Same look as ProfilePreferenceTabs, with 서재 in place of 내 활동. */
export function OtherUserProfileTabs({ activeTab, onChangeTab, libraryCount }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab
        const label =
          tab.key === 'library' && libraryCount != null ? `${tab.label} (${libraryCount})` : tab.label
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (!active) onChangeTab(tab.key)
            }}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {label}
            </Text>
            <View
              style={[styles.tabIndicator, active ? styles.tabIndicatorActive : styles.tabIndicatorInactive]}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: C.card,
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
    backgroundColor: Gray[200],
  },
})
