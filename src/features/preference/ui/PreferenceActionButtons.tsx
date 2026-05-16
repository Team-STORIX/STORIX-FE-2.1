import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Magenta, Radius, Typography } from '../../../theme'

type PreferenceActionButtonsProps = {
  onDislike: () => void
  onLike: () => void
  disabled?: boolean
}

export function PreferenceActionButtons({
  onDislike,
  onLike,
  disabled = false,
}: PreferenceActionButtonsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onDislike}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          styles.dislikeButton,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="별로에요"
      >
        <Text style={styles.dislikeLabel}>별로에요</Text>
      </Pressable>

      <Pressable
        onPress={onLike}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          styles.likeButton,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="좋아요!"
      >
        <Text style={styles.likeLabel}>좋아요!</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dislikeButton: {
    backgroundColor: Magenta[50],
  },
  likeButton: {
    backgroundColor: Magenta[300],
  },
  dislikeLabel: {
    ...Typography.body1Semibold,
    color: Magenta[300],
    fontFamily: 'SUIT',
  },
  likeLabel: {
    ...Typography.body1Semibold,
    color: C.card,
    fontFamily: 'SUIT',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
})
