import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Magenta, Typography } from '../../../theme'

const starIcon = require('../../../../assets/icons/common/littleStar.svg')

type Props = {
  /**
   * Membership start date (ISO) — the day the user joined the room.
   * Bar is hidden when absent or invalid.
   *
   * Requires BE to provide joinedAt/participatedAt. Do not use lastChatTime
   * (that is last-activity only, not a membership date). The current TopicRoom
   * Swagger exposes no such field, so this prop is effectively never populated
   * and the bar renders null until the backend adds one.
   */
  startDate?: string | null
}

const daysSince = (iso: string): number | null => {
  const start = new Date(iso)
  if (Number.isNaN(start.getTime())) return null
  const diffMs = Date.now() - start.getTime()
  if (diffMs < 0) return null
  return Math.floor(diffMs / 86_400_000)
}

export function TopicRoomDdayBar({ startDate }: Props) {
  if (!startDate) return null
  const days = daysSince(startDate)
  if (days == null) return null

  return (
    <View style={styles.bar}>
      <Image source={starIcon} style={styles.icon} contentFit="contain" />
      <Text style={styles.text}>{`이 방과 함께한 지 ${days}일이 지났어요!`}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 32,
    width: '100%',
    backgroundColor: Magenta[20],
  },
  icon: {
    width: 12,
    height: 12,
  },
  text: {
    ...Typography.caption1Medium,
    color: C.primary,
  },
})
