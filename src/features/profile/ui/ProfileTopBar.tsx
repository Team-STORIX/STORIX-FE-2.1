import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, Gray, Typography } from '../../../theme'

type Props = {
  onPressSettings: () => void
}

export function ProfileTopBar({ onPressSettings }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>프로필</Text>

      <View style={styles.actions}>
        <Pressable disabled style={styles.profileCardButton} accessibilityRole="button">
          <Text style={styles.profileCardButtonText}>프로필 카드</Text>
        </Pressable>

        <Pressable
          onPress={onPressSettings}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="설정"
        >
          <Ionicons name="settings-outline" size={24} color={C.text} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileCardButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  profileCardButtonText: {
    ...Typography.caption1Extrabold,
    color: Gray[600],
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
})
