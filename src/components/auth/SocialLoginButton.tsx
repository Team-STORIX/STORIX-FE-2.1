import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Radius } from '../../theme/radius'

type Props = {
  label: string
  icon?: string
  backgroundColor: string
  textColor?: string
  spinnerColor?: string
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
}

export function SocialLoginButton({
  label,
  icon,
  backgroundColor,
  textColor = '#fff',
  spinnerColor,
  onPress,
  isLoading,
  disabled,
}: Props) {
  const isDisabled = disabled || isLoading

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor },
        isDisabled && styles.btnDisabled,
        pressed && !isDisabled && styles.btnPressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
    >
      {isLoading ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={spinnerColor ?? textColor} />
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      ) : (
        <View style={styles.row}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnPressed: { opacity: 0.82 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 18 },
  label: { fontSize: 15, fontWeight: '600' },
})
