import { StyleSheet, Text, View } from 'react-native'
import { C } from '../../theme/colors'
import { Typography } from '../../theme/typography'

export function HashtagChip({ label }: { label: string }) {
  const text = label.startsWith('#') ? label : `#${label}`

  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.bg,
  },
  label: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },
})
