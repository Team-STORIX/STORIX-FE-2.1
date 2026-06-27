import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Magenta, Typography } from '../../../theme'
import { calendarDaysSince } from '../../../lib/utils/parseValidDate'

const starIcon = require('../../../../assets/icons/common/littleStar.svg')

type Props = {
  /**
   * Membership start date (ISO) — the day the user joined the room. Sourced
   * from the chat-history response's `joinedAt` (GET /chat/rooms/{id}/messages).
   * Bar is hidden when absent, invalid, or in the future.
   *
   * Do NOT pass lastChatTime here (that is last-activity only, not a membership
   * date).
   */
  startDate?: string | null
}

export function TopicRoomDdayBar({ startDate }: Props) {
  // Calendar-day elapsed count. Returns null for missing/invalid/future dates,
  // so the bar never renders "NaN일" or a misleading value — it simply hides.
  // Convention: elapsed days, so joining today shows "0일이 지났어요!".
  const days = calendarDaysSince(startDate)
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
