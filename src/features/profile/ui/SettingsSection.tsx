import { StyleSheet, Text, TextStyle, View } from 'react-native'
import { SettingsItem } from './SettingsItem'
import { C } from '../../../theme'

export type SettingsItemConfig = {
  label: string
  hasArrow?: boolean
  rightLabel?: string
  rightLabelVariant?: 'version' | 'social'
  onPress?: () => void
}

type Props = {
  title: string
  items: SettingsItemConfig[]
}

export function SettingsSection({ title, items }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.itemList}>
        {items.map((item) => (
          <SettingsItem
            key={item.label}
            label={item.label}
            hasArrow={item.hasArrow}
            rightLabel={item.rightLabel}
            rightLabelVariant={item.rightLabelVariant}
            onPress={item.onPress}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 25.2,
    color: C.text,
    marginBottom: 24,
  },
  itemList: {},
})
