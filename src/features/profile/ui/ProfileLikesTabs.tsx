import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Typography } from '../../../theme'

export type ProfileLikesTab = 'works' | 'writers'

type Props = {
  activeTab: ProfileLikesTab
  onChange: (tab: ProfileLikesTab) => void
}

export function ProfileLikesTabs({ activeTab, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.tab} onPress={() => onChange('writers')}>
        <Text
          style={[
            styles.label,
            activeTab === 'writers' ? styles.labelActive : styles.labelInactive,
          ]}
        >
          {'\uad00\uc2ec \uc791\uac00'}
        </Text>
        <View
          style={[
            styles.indicator,
            activeTab === 'writers' ? styles.indicatorActive : styles.indicatorInactive,
          ]}
        />
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onChange('works')}>
        <Text
          style={[
            styles.label,
            activeTab === 'works' ? styles.labelActive : styles.labelInactive,
          ]}
        >
          {'\uad00\uc2ec \uc791\ud488'}
        </Text>
        <View
          style={[
            styles.indicator,
            activeTab === 'works' ? styles.indicatorActive : styles.indicatorInactive,
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
    backgroundColor: C.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  label: {
    ...Typography.body1Medium,
  },
  labelActive: {
    color: Gray[900],
  },
  labelInactive: {
    color: Gray[400],
  },
  indicator: {
    width: '100%',
    height: 2,
  },
  indicatorActive: {
    backgroundColor: Gray[900],
  },
  indicatorInactive: {
    backgroundColor: Gray[400],
  },
})
