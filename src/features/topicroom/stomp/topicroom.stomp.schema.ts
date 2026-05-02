// src/features/topicroom/stomp/topicroom.stomp.schema.ts
import { z } from 'zod'

//   STOMP로 내려오는 채팅 메시지(필요 필드만 정확히 정의 + 나머지는 passthrough)
export const TopicRoomStompMessageSchema = z
  .object({
    messageId: z.union([z.string(), z.number()]).optional(),
    roomId: z.number().optional(),
    type: z.string().optional(), // TALK 등
    message: z.string(),
    senderId: z.number().optional(),
    senderName: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough()

export type TopicRoomStompMessage = z.infer<typeof TopicRoomStompMessageSchema>

//   UI에서 쓰는 메시지 형태
export type TopicRoomUiMsg = {
  id: string
  type: 'me' | 'other'
  userName?: string
  senderId?: number
  text: string
  time: string
  createdAt?: string
}
