import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C } from '../../theme/colors'

type Props = {
  label: string
  sublabel?: string
  onPress?: () => void
  disabled?: boolean
  destructive?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function ProfileMenuItem({
  label,
  sublabel,
  onPress,
  disabled,
  destructive,
  isFirst,
  isLast,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        isFirst && styles.itemFirst,
        isLast && styles.itemLast,
        !isLast && styles.itemBorder,
        pressed && !disabled && styles.itemPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={[styles.label, destructive && styles.labelDestructive, disabled && styles.labelDisabled]}>
        {label}
      </Text>
      <View style={styles.right}>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        <Text style={[styles.chevron, disabled && styles.chevronDisabled]}>›</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemFirst: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  itemLast: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemPressed: { backgroundColor: C.divider },

  label: { fontSize: 15, color: C.text, fontWeight: '500' },
  labelDestructive: { color: C.error },
  labelDisabled: { color: C.textMuted },

  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sublabel: { fontSize: 13, color: C.textMuted },
  chevron: { fontSize: 20, color: C.textMuted, lineHeight: 22 },
  chevronDisabled: { color: C.divider },
})
