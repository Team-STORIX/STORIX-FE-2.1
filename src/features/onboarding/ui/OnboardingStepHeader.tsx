import type { ReactNode } from 'react'
import { StyleSheet, Text } from 'react-native'
import { C, Gray, Typography } from '../../../theme'

type OnboardingStepHeaderProps = {
  title: string
  /** 문자열 또는 강조(count) span 을 포함한 노드. 생략하면 부제목을 그리지 않는다. */
  subtitle?: ReactNode
}

/** 온보딩 각 단계 상단의 제목 + 부제목 */
export function OnboardingStepHeader({ title, subtitle }: OnboardingStepHeaderProps) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle != null ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </>
  )
}

export const stepHeaderStyles = StyleSheet.create({
  title: {
    ...Typography.heading1,
    color: C.text,
  },
  subtitle: {
    marginTop: 5,
    ...Typography.body1Medium,
    color: Gray[500],
  },
  count: {
    ...Typography.body1Medium,
    color: C.primary,
  },
})

const styles = stepHeaderStyles
