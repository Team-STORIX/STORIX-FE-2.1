import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')

type Props = {
  onBack: () => void
  isEditing: boolean
  onToggleEdit: () => void
}

export function ProfileLikesTopBar({ onBack, isEditing, onToggleEdit }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
      </Pressable>

      <Text style={styles.title}>관심작품</Text>
      <Pressable
        onPress={onToggleEdit}
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={isEditing ? '편집 취소' : '편집'}
      >
        <Text style={styles.editText}>{isEditing ? '취소' : '편집'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  title: {
    marginLeft: 12,
    ...Typography.heading2,
    color: Gray[900],
  },
  editButton: {
    marginLeft: 'auto',
    paddingVertical: 8,
  },
  editText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  pressed: {
    opacity: 0.7,
  },
})
