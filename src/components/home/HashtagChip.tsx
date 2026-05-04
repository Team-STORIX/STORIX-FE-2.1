import { Pressable, StyleSheet, Text } from 'react-native'
import { Gray } from '../../theme/colors'
import { Typography } from '../../theme/typography'

type HashtagChipProps = {
  label: string
  onPress?: () => void
}

export function HashtagChip({ label, onPress }: HashtagChipProps) {
  const text = label.startsWith('#') ? label : `#${label}`
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
    >
      <Text style={styles.label}>{text}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  chipPressed: {
    opacity: 0.75,
  },
  label: {
    ...Typography.body2Medium,
    color: Gray[900],
  },
})
