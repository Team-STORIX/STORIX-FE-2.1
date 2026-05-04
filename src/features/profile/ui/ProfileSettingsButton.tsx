import { Pressable, StyleSheet, Text } from 'react-native'
import { C } from '../../../theme'

type Props = {
  label: string
  onPress: () => void
  disabled?: boolean
  destructive?: boolean
}

export function ProfileSettingsButton({
  label,
  onPress,
  disabled,
  destructive,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        destructive ? styles.buttonDestructive : styles.buttonDefault,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.label, destructive ? styles.labelDestructive : styles.labelDefault]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDefault: {
    borderColor: C.border,
  },
  buttonDestructive: {
    borderColor: C.error,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelDefault: {
    color: C.text,
  },
  labelDestructive: {
    color: C.error,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
})
