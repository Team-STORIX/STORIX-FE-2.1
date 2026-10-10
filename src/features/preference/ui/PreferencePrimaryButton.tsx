import { Pressable, StyleSheet, Text } from 'react-native'
import { C, Radius, Typography } from '../../../theme'

type PreferencePrimaryButtonProps = {
  label: string
  onPress: () => void
  disabled?: boolean
}

export function PreferencePrimaryButton({
  label,
  onPress,
  disabled = false,
}: PreferencePrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: Radius.sm,
    backgroundColor: C.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.body1Medium,
    color: C.card,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
})
