import { StyleSheet, Text, View } from 'react-native'
import { Gray } from '../../theme/colors'
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
  },
  label: {
    ...Typography.body2Medium,
    color: Gray[900],
  },
})
