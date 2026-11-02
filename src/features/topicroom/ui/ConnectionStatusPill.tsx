import { StyleSheet, Text, View } from 'react-native'
import { C } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

type Props = { status: Status }

const LABEL: Record<Exclude<Status, 'open'>, string> = {
  idle: '대기 중',
  connecting: '연결 중',
  closed: '연결 끊김',
  error: '연결 오류',
}

const DOT_COLOR: Record<Exclude<Status, 'open'>, string> = {
  idle: C.textMuted,
  connecting: C.star,
  closed: C.textMuted,
  error: C.error,
}

export function ConnectionStatusPill({ status }: Props) {
  if (status === 'open') return null

  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: DOT_COLOR[status] }]} />
      <Text style={styles.label}>{LABEL[status]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: C.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    marginVertical: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: { ...Typography.caption1Medium, color: C.textSecondary },
})
