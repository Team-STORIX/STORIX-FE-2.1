import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'

const profileDefault = require('../../../../assets/icons/profile/profile-default.svg')

export type DisplayMsg = {
  key: string
  text: string
  senderId?: number
  senderName: string
  profileImageUrl?: string | null
  time: string
  isMe: boolean
}

type Props = {
  msg: DisplayMsg
  onLongPressOther?: (msg: DisplayMsg) => void
}

export function ChatBubble({ msg, onLongPressOther }: Props) {
  if (msg.isMe) {
    return (
      <View style={styles.rowMe}>
        <Text style={styles.timeMe}>{msg.time}</Text>
        <View style={[styles.bubble, styles.bubbleMe]}>
          <Text style={styles.textMe}>{msg.text}</Text>
        </View>
      </View>
    )
  }

  const handleLongPress = onLongPressOther ? () => onLongPressOther(msg) : undefined

  return (
    <View style={styles.rowOther}>
      <View style={styles.avatar}>
        <Image
          source={msg.profileImageUrl ? { uri: msg.profileImageUrl } : profileDefault}
          style={styles.avatarImage}
          contentFit="cover"
        />
      </View>
      <View style={styles.otherBody}>
        <Text style={styles.senderName}>{msg.senderName || '익명'}</Text>
        <View style={styles.otherBubbleRow}>
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.bubble,
              styles.bubbleOther,
              pressed && handleLongPress ? styles.pressed : null,
            ]}
          >
            <Text style={styles.textOther}>{msg.text}</Text>
          </Pressable>
          <Text style={styles.timeOther}>{msg.time}</Text>
        </View>
      </View>
    </View>
  )
}

const AVATAR_SIZE = 36
const BUBBLE_RADIUS = 18

const styles = StyleSheet.create({
  rowMe: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  rowOther: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryLight,
    overflow: 'hidden',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },

  otherBody: { flexShrink: 1 },
  senderName: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
    marginBottom: 4,
  },
  otherBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  bubble: {
    maxWidth: 260,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BUBBLE_RADIUS,
  },
  bubbleMe: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 6,
    marginLeft: 6,
  },
  bubbleOther: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 6,
  },
  pressed: {
    opacity: 0.7,
  },

  textMe: { ...Typography.body2Medium, color: '#fff' },
  textOther: { ...Typography.body2Medium, color: C.text },

  timeMe: {
    ...Typography.caption2Medium,
    color: C.textMuted,
    marginRight: 6,
    marginBottom: 2,
  },
  timeOther: {
    ...Typography.caption2Medium,
    color: C.textMuted,
    marginLeft: 6,
    marginBottom: 2,
    flexShrink: 0,
  },
})
