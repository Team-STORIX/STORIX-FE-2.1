import { StyleSheet, Text, View } from 'react-native'
import { C } from '../../../theme/colors'

export type DisplayMsg = {
  key: string
  text: string
  senderName: string
  time: string
  isMe: boolean
}

type Props = { msg: DisplayMsg }

export function ChatBubble({ msg }: Props) {
  const initial = (msg.senderName || '?')[0].toUpperCase()

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

  return (
    <View style={styles.rowOther}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
      <View style={styles.otherBody}>
        <Text style={styles.senderName}>{msg.senderName}</Text>
        <View style={styles.otherBubbleRow}>
          <View style={[styles.bubble, styles.bubbleOther]}>
            <Text style={styles.textOther}>{msg.text}</Text>
          </View>
          <Text style={styles.timeOther}>{msg.time}</Text>
        </View>
      </View>
    </View>
  )
}

const AVATAR_SIZE = 32
const BUBBLE_RADIUS = 16

const styles = StyleSheet.create({
  rowMe: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 6,
    paddingHorizontal: 14,
  },
  rowOther: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    paddingHorizontal: 14,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarInitial: { fontSize: 13, fontWeight: '700', color: C.primary },

  otherBody: { flexShrink: 1 },
  senderName: {
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 3,
  },
  otherBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  bubble: {
    maxWidth: 240,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BUBBLE_RADIUS,
  },
  bubbleMe: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
    marginLeft: 6,
  },
  bubbleOther: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },

  textMe: { fontSize: 14, color: '#fff', lineHeight: 20 },
  textOther: { fontSize: 14, color: C.text, lineHeight: 20 },

  timeMe: { fontSize: 10, color: C.textMuted, marginRight: 4, marginBottom: 2 },
  timeOther: {
    fontSize: 10,
    color: C.textMuted,
    marginLeft: 4,
    marginBottom: 2,
    flexShrink: 0,
  },
})
