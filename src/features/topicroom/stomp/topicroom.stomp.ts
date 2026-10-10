// src/features/topicroom/stomp/topicroom.stomp.ts
import {
  TopicRoomActiveUsersMessageSchema,
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
export const topicRoomActiveUsersSubPath = (roomId: number) =>
  `/sub/topic-rooms/${roomId}/active-users`
export const topicRoomPubPath = () => `/pub/chat/message`

// Event types that are transport/keepalive frames, not chat content. If the
// backend ever delivers these on the subscribed room destination they must be
// ignored — never rendered as a ChatBubble.
const IGNORED_EVENT_TYPES = new Set([
  'HEARTBEAT',
  'PING',
  'PONG',
  'ALIVE',
  'SESSION_ALIVE',
  'KEEPALIVE',
])

export const isIgnoredStompEventType = (type?: string): boolean =>
  !!type && IGNORED_EVENT_TYPES.has(type.toUpperCase())

// A STOMP MESSAGE frame with an empty / whitespace-only body carries no chat
// payload (custom heartbeat / session-alive frames). Never feed it to the chat
// schema.
export function isIgnorableStompBody(body?: string): boolean {
  return !body || body.trim().length === 0
}

// Parses a raw STOMP body exactly once. Returns { ok: false } when the body is
// present but not JSON (plain-text keepalive frames), so callers can ignore it
// without a second parse attempt.
export function parseStompBodyJson(
  rawBody: string,
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(rawBody) }
  } catch {
    return { ok: false }
  }
}

const safeId = (v: unknown) => {
  if (typeof v === 'string' && v.length > 0) return v
  if (typeof v === 'number') return String(v)
  return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const safeNumericId = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
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

// Normalizes an already-JSON-parsed STOMP object. Splitting the schema step
// from JSON parsing lets the subscription callback log a single set of
// diagnostics (bodyJsonKeys, zodIssues) without parsing the body twice.
export type NormalizeStompObjectResult =
  | { ok: true; uiMsg: TopicRoomUiMsg }
  | { ok: false; zodIssues: unknown; rawType: string }

export function normalizeTopicRoomStompObject(
  obj: unknown,
  options?: { myUserId?: number | null },
): NormalizeStompObjectResult {
  const parsed = TopicRoomStompMessageSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      ok: false,
      zodIssues: parsed.error.issues,
      rawType: Array.isArray(obj) ? 'array' : typeof obj,
    }
  }

  const m = parsed.data
  const message = m.message ?? ''
  const isMe =
    !!options?.myUserId &&
    typeof m.senderId === 'number' &&
    m.senderId === options.myUserId

  return {
    ok: true,
    uiMsg: {
      id: safeId(m.messageId ?? m.createdAt ?? Date.now()),
      chatMessageId: safeNumericId(m.messageId),
      eventType: m.type,
      activeUserNumber: m.activeUserNumber,
      type: isMe ? 'me' : 'other',
      userName: m.senderName,
      senderRole: m.senderRole,
      senderId: m.senderId,
      profileImageUrl: m.senderProfileImageUrl,
      text: message,
      time: formatKoTime(m.createdAt),
      createdAt: m.createdAt,
    },
  }
}

export function normalizeTopicRoomStompMessage(
  rawBody: string,
  options?: { myUserId?: number | null },
): TopicRoomUiMsg | null {
  if (isIgnorableStompBody(rawBody)) return null
  const parsed = parseStompBodyJson(rawBody)
  if (!parsed.ok) return null
  const result = normalizeTopicRoomStompObject(parsed.value, options)
  return result.ok ? result.uiMsg : null
}

export function normalizeTopicRoomActiveUsersMessage(
  rawBody: string,
): { topicRoomId: number; activeUserNumber: number } | null {
  let obj: unknown = null
  try {
    obj = JSON.parse(rawBody)
  } catch {
    return null
  }

  const parsed = TopicRoomActiveUsersMessageSchema.safeParse(obj)
  return parsed.success ? parsed.data : null
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
