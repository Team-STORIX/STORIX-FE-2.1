import { Pressable, StyleSheet, Text } from 'react-native'
import { C, Gray, Radius, Typography } from '../../../theme'

type OnboardingCtaButtonProps = {
  label: string
  /** 활성 스타일(검정 배경). false 면 회색 비활성 스타일 */
  active: boolean
  disabled?: boolean
  onPress: () => void
}

/** 약관 동의 / 온보딩 하단의 "다음으로" 버튼 */
export function OnboardingCtaButton({ label, active, disabled, onPress }: OnboardingCtaButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, active ? styles.buttonActive : styles.buttonInactive]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: C.text,
  },
  buttonInactive: {
    backgroundColor: Gray[200],
  },
  text: {
    ...Typography.body1Medium,
  },
  textActive: {
    color: C.card,
  },
  textInactive: {
    color: Gray[500],
  },
})
