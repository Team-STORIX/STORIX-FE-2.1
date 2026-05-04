// src/features/topicroom/stomp/topicroom.stomp.ts
import {
  TopicRoomStompMessageSchema,
  type TopicRoomUiMsg,
} from './topicroom.stomp.schema'

export const STORIX_STOMP_BROKER_URL = 'wss://api.storix.kr/ws-stomp'

export const topicRoomSubPath = (roomId: number) => `/sub/chat/room/${roomId}`
export const topicRoomPubPath = () => `/pub/chat/message`

const safeId = (v: unknown) => {
  if (typeof v === 'string' && v.length > 0) return v
  if (typeof v === 'number') return String(v)
  return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const formatKoTime = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

export function normalizeTopicRoomStompMessage(
  rawBody: string,
  options?: { myUserId?: number | null },
): TopicRoomUiMsg | null {
  let obj: unknown = null
  try {
    obj = JSON.parse(rawBody)
  } catch {
    return null
  }

  const parsed = TopicRoomStompMessageSchema.safeParse(obj)
  if (!parsed.success) return null

  const m = parsed.data
  const isMe =
    !!options?.myUserId &&
    typeof m.senderId === 'number' &&
    m.senderId === options.myUserId

  return {
    id: safeId(m.messageId ?? m.createdAt ?? Date.now()),
    type: isMe ? 'me' : 'other',
    userName: m.senderName,
    senderId: m.senderId,
    text: m.message,
    time: formatKoTime(m.createdAt),
    createdAt: m.createdAt,
  }
}

export const makeSubscriptionId = (roomId: number) => {
  // crypto.randomUUID() is available in Hermes (RN 0.71+).
  // Fallback retained for test environments that may lack it.
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`
  return `sub_chat_room_${roomId}_${uuid}`
}
