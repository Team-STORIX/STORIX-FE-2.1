import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Typography } from '../../../theme'

const settingsIcon = require('../../../../assets/icons/common/settings.svg')

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
          <Image source={settingsIcon} style={styles.settingsIcon} contentFit="contain" />
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E3DCDF',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
  },
  profileCardButtonText: {
    fontFamily: 'SUIT',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16.8,
    color: '#645C5F',
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.7,
  },
})
