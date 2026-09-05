// src/features/topicroom/stomp/topicroom.stomp.schema.ts
import { z } from 'zod'

// Backend STOMP payloads use slightly different field names across deployments
// (the REST history endpoint already tolerates the same drift — see
// api/chat.schema.ts). These helpers coerce whichever alias arrives into the
// single canonical shape the schema below validates, so a renamed field no
// longer produces an empty `message` (which the UI silently drops).
const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value
    if (typeof value === 'number') return String(value)
  }
  return undefined
}

const firstNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (value == null || value === '') continue
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

//   STOMP로 내려오는 채팅 메시지(필요 필드만 정확히 정의 + 나머지는 passthrough)
//   preprocess: 백엔드가 보내는 다양한 alias를 canonical 필드로 정규화한다.
export const TopicRoomStompMessageSchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input
    const o = input as Record<string, unknown>
    return {
      ...o,
      // messageId / id / chatMessageId
      messageId: o.messageId ?? o.id ?? o.chatMessageId,
      // roomId / topicRoomId / chatRoomId
      roomId: firstNumber(o.roomId, o.topicRoomId, o.chatRoomId),
      // senderId / userId / memberId (coerced so a stringified id never fails schema)
      senderId: firstNumber(o.senderId, o.userId, o.memberId),
      // senderName / senderNickname / nickName / nickname / userName
      senderName: firstString(
        o.senderName,
        o.senderNickname,
        o.nickName,
        o.nickname,
        o.userName,
      ),
      senderRole: firstString(
        o.senderRole,
        o.role,
        o.profileRole,
        (o.profile as Record<string, unknown> | undefined)?.role,
      ),
      // senderProfileImageUrl / profileImageUrl / senderProfileImage
      senderProfileImageUrl: firstString(
        o.senderProfileImageUrl,
        o.profileImageUrl,
        o.senderProfileImage,
      ),
      // type / messageType / eventType — the backend ChatMessageResponseDto
      // names this field `messageType`; canonicalize it to `type` so the
      // TALK / ENTER / LEAVE routing below sees it.
      type: firstString(o.type, o.messageType, o.eventType),
      // The live broker omits this field for ordinary messages. Normalize it
      // before Zod validation rather than making a missing optional field pass
      // through a preprocess pipe as an invalid required value.
      activeUserNumber: firstNumber(o.activeUserNumber),
      // message / content / text
      message: firstString(o.message, o.content, o.text),
      // createdAt / sentAt / createdDate
      createdAt: firstString(o.createdAt, o.sentAt, o.createdDate),
    }
  },
  z
    .object({
      messageId: z.union([z.string(), z.number()]).optional(),
      roomId: z.number().optional(),
      type: z.string().optional(), // TALK / ENTER / LEAVE / SYSTEM / HEARTBEAT 등
      // The broker sends `messageType: null` for some messages. `type` above
      // is the canonical field the UI uses, so preserve this raw alias safely.
      messageType: z.string().nullish(),
      message: z.string().optional(),
      senderId: z.number().optional(),
      senderName: z.string().optional(),
      senderRole: z.string().optional(),
      senderProfileImageUrl: z.string().optional(),
      activeUserNumber: z.number().optional(),
      createdAt: z.string().optional(),
    })
    .passthrough(),
)

export type TopicRoomStompMessage = z.infer<typeof TopicRoomStompMessageSchema>

export const TopicRoomActiveUsersMessageSchema = z.object({
  topicRoomId: z.preprocess((v) => Number(v), z.number()),
  activeUserNumber: z.preprocess((v) => Number(v), z.number()),
})

export type TopicRoomActiveUsersMessage = z.infer<
  typeof TopicRoomActiveUsersMessageSchema
>

//   UI에서 쓰는 메시지 형태
export type TopicRoomUiMsg = {
  id: string
  chatMessageId?: number
  eventType?: string
  activeUserNumber?: number
  type: 'me' | 'other'
  userName?: string
  senderRole?: string
  senderId?: number
  profileImageUrl?: string
  text: string
  time: string
  createdAt?: string
}
