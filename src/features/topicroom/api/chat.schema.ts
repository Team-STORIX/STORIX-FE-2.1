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

/** 과거 메시지 item */
export const ChatRoomMessageSchema = z.object({
  id: z.preprocess((v) => Number(v), z.number()),
  roomId: z.preprocess((v) => Number(v), z.number()),
  senderId: z.preprocess((v) => Number(v), z.number()),
  senderName: z.string(),
  message: z.string(),
  messageType: z.string().nullish(),
  createdAt: z.string().optional().nullish(),
})

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
 * New wrapped chat-history response:
 *   { joinedAt: string | null, messages: <paginated message page> }
 *
 * joinedAt is the membership start date (do NOT confuse with message.createdAt).
 * Kept nullable/optional so old direct-page responses (no wrapper) stay valid
 * via the union below.
 */
export const ChatRoomMessageHistoryWrappedSchema = z.object({
  joinedAt: z.string().nullish(),
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
  joinedAt: string | null
  content: ChatRoomMessage[]
  last: boolean
  empty: boolean
  number: number
}
