// src/features/topicroom/stomp/topicroom.stomp.ts
import {
  TopicRoomStompMessageSchema,
  type TopicRoomUiMsg,
} from './topicroom.stomp.schema'

// Hardcoded production broker — used as a fallback when the env URL is missing
// or unparseable so the chat never silently points at the wrong host.
const FALLBACK_STOMP_BROKER_URL = 'wss://api.storix.kr/ws-stomp'

// Derive the STOMP endpoint from the same origin as the REST API so that
// staging/local builds connect to their own backend instead of prod:
//   https://api.storix.kr  → wss://api.storix.kr/ws-stomp
//   http://localhost:8080  → ws://localhost:8080/ws-stomp
const resolveBrokerURL = (): string => {
  const base = process.env.EXPO_PUBLIC_API_URL
  if (!base) return FALLBACK_STOMP_BROKER_URL
  try {
    const u = new URL(base)
    const wsProtocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${u.host}/ws-stomp`
  } catch {
    return FALLBACK_STOMP_BROKER_URL
  }
}

export const STORIX_STOMP_BROKER_URL = resolveBrokerURL()

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
