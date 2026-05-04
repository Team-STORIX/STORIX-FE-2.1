import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Gray } from '../../../theme/colors'

export type FeedTab = 'works' | 'writers'

type FeedTopbarProps = {
  activeTab: FeedTab
  onChange: (tab: FeedTab) => void
}

export function FeedTopbar({ activeTab, onChange }: FeedTopbarProps) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={() => onChange('works')} hitSlop={8}>
        <Text style={[styles.tab, activeTab === 'works' ? styles.tabActive : styles.tabInactive]}>
          관심 작품
        </Text>
      </Pressable>
      <Pressable onPress={() => onChange('writers')} hitSlop={8}>
        <Text style={[styles.tab, activeTab === 'writers' ? styles.tabActive : styles.tabInactive]}>
          관심 작가
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  tab: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
  },
  tabActive: {
    color: Gray[900],
  },
  tabInactive: {
    color: Gray[200],
  },
})
