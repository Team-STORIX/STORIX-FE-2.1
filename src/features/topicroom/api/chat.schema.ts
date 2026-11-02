// src/features/topicroom/api/chat.schema.ts
import { z } from 'zod'

/** 공통 API 래퍼(isSuccess/code/message/result/timestamp) */
export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string(),
    message: z.string(),
    result,
    timestamp: z.string().optional(),
  })

const stringFrom = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
  }
  return ''
}

const numberFrom = (...values: unknown[]) => {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

/** 과거 메시지 item */
export const ChatRoomMessageSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object') return input
  const obj = input as Record<string, unknown>
  return {
    ...obj,
    id: numberFrom(obj.id, obj.chatMessageId, obj.messageId),
    roomId: numberFrom(obj.roomId, obj.topicRoomId, obj.chatRoomId),
    senderId: numberFrom(obj.senderId, obj.userId, obj.memberId),
    senderName: stringFrom(
      obj.senderName,
      obj.userName,
      obj.nickname,
      obj.nickName,
    ),
    senderRole: stringFrom(
      obj.senderRole,
      obj.role,
      (obj.profile as Record<string, unknown> | undefined)?.role,
    ),
    message: stringFrom(obj.message, obj.content, obj.text),
    createdAt: stringFrom(obj.createdAt, obj.sentAt, obj.createdDate),
  }
}, z.object({
  id: z.number(),
  roomId: z.number(),
  senderId: z.number(),
  senderName: z.string(),
  senderRole: z.string().optional(),
  message: z.string(),
  messageType: z.string().nullish(),
  createdAt: z.string().optional().nullish(),
}))

export type ChatRoomMessage = z.infer<typeof ChatRoomMessageSchema>

/**
 * Spring Page 형태(과거 메시지 조회용)
 */
export const ChatRoomMessagePageSchema = z.object({
  content: z.array(ChatRoomMessageSchema),
  number: z.number().default(0),
  last: z.boolean().default(false),
  empty: z.boolean().default(false),
  first: z.boolean().optional(),
  size: z.number().optional(),
  numberOfElements: z.number().optional(),
  totalElements: z.number().optional(),
  totalPages: z.number().optional(),
  pageable: z.any().optional(),
  sort: z.any().optional(),
})

export type ChatRoomMessagePage = z.infer<typeof ChatRoomMessagePageSchema>

/**
 * Wrapped chat-history response:
 *   { joinedDays: string | null, activeUserNumber: number | null, messages: <page> }
 *
 * joinedAt is retained as optional legacy input so older deployments remain
 * valid via this wrapper while the app reads joinedDays going forward.
 */
export const ChatRoomMessageHistoryWrappedSchema = z.object({
  joinedAt: z.string().nullish(),
  joinedDays: z.string().nullish(),
  activeUserNumber: z.preprocess(
    (v) => (v == null ? undefined : Number(v)),
    z.number().optional().nullish(),
  ),
  messages: ChatRoomMessagePageSchema,
})

export type ChatRoomMessageHistoryWrapped = z.infer<
  typeof ChatRoomMessageHistoryWrappedSchema
>

/** Accepts either the new wrapped shape or the legacy direct page shape. */
export const ChatRoomMessageHistorySchema = z.union([
  ChatRoomMessageHistoryWrappedSchema,
  ChatRoomMessagePageSchema,
])

/**
 * Single normalized page type the screen consumes, regardless of whether the
 * backend sent the wrapped or the legacy direct-page response.
 */
export type NormalizedChatRoomMessagePage = {
  joinedDays: string | null
  activeUserNumber: number | null
  content: ChatRoomMessage[]
  last: boolean
  empty: boolean
  number: number
}
