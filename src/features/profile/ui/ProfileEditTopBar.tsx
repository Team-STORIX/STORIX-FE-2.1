import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Gray, Magenta, Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')

type Props = {
  canSubmit: boolean
  isSaving: boolean
  onBack: () => void
  onSubmit: () => void
}

export function ProfileEditTopBar({ canSubmit, isSaving, onBack, onSubmit }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={'\ub4a4\ub85c\uac00\uae30'}
      >
        <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
      </Pressable>

      <Text style={styles.title}>{'\ud504\ub85c\ud544 \uc218\uc815'}</Text>

      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit || isSaving}
        style={({ pressed }) => [
          styles.submitButton,
          pressed && canSubmit && !isSaving && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={'\uc644\ub8cc'}
      >
        <Text
          style={[
            styles.submitText,
            canSubmit && !isSaving ? styles.submitTextEnabled : styles.submitTextDisabled,
          ]}
        >
          {isSaving ? '\uc800\uc7a5 \uc911' : '\uc644\ub8cc'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
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
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    ...Typography.body1Medium,
    color: Gray[900],
  },
  submitButton: {
    minWidth: 48,
    minHeight: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  submitText: {
    ...Typography.body1Medium,
  },
  submitTextEnabled: {
    color: Magenta[300],
  },
  submitTextDisabled: {
    color: Gray[500],
  },
  pressed: {
    opacity: 0.7,
  },
})
