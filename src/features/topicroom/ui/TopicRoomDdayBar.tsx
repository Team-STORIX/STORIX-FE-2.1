import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Magenta, Typography } from '../../../theme'

const starIcon = require('../../../../assets/icons/common/littleStar.svg')

type Props = {
  /**
   * Membership duration label from GET /chat/rooms/{id}/messages.
   * Example: "3일". Hidden when absent.
   */
  joinedDays?: string | null
}

export function TopicRoomDdayBar({ joinedDays }: Props) {
  const label = joinedDays?.trim()
  if (!label) return null

  return (
    <View style={styles.bar}>
      <Image source={starIcon} style={styles.icon} contentFit="contain" />
      <Text style={styles.text}>{`이 방과 함께한 지 ${label}이 지났어요!`}</Text>
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
