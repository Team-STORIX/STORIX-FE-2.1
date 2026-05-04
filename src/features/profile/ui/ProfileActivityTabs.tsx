import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Typography } from '../../../theme'

export type ProfileActivityTab = 'posts' | 'comments' | 'likes'

const TAB_LABELS: Record<ProfileActivityTab, string> = {
  posts: '게시글',
  comments: '댓글',
  likes: '좋아요',
}

export function ProfileActivityTabs({
  activeTab,
  onChange,
}: {
  activeTab: ProfileActivityTab
  onChange: (tab: ProfileActivityTab) => void
}) {
  return (
    <View style={styles.container}>
      {(Object.keys(TAB_LABELS) as ProfileActivityTab[]).map((tab) => {
        const active = tab === activeTab
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {TAB_LABELS[tab]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 36,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  tabActive: {
    backgroundColor: Gray[900],
  },
  tabInactive: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: Gray[400],
  },
  label: {
    ...Typography.body2Medium,
  },
  labelActive: {
    color: C.card,
  },
  labelInactive: {
    color: Gray[400],
  },
})
