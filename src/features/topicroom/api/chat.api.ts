// src/features/topicroom/api/chat.api.ts
import { apiClient } from '../../../lib/api/axios-instance'
import {
  ApiEnvelopeSchema,
  ChatRoomMessageHistorySchema,
  type NormalizedChatRoomMessagePage,
} from './chat.schema'

const MessagesEnvelopeSchema = ApiEnvelopeSchema(ChatRoomMessageHistorySchema)

// GET /api/v1/chat/rooms/{roomId}/messages
//
// The backend now returns { joinedAt, messages: <page> }, but older deployments
// return the page directly. We accept both and collapse them into a single
// normalized page so the screen/infinite-query layer never branches on shape.
export async function getChatRoomMessages(params: {
  roomId: number
  page?: number
  size?: number
  sort?: string
}): Promise<NormalizedChatRoomMessagePage> {
  const res = await apiClient.get(
    `/api/v1/chat/rooms/${params.roomId}/messages`,
    {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'createdAt,DESC',
      },
      headers: { accept: '*/*' },
    },
  )

  const result = MessagesEnvelopeSchema.parse(res.data).result

  // New wrapped shape: { joinedAt, messages }. Legacy shape: the page itself.
  const isWrapped = 'messages' in result
  const page = isWrapped ? result.messages : result
  const joinedAt = isWrapped ? (result.joinedAt ?? null) : null

  return {
    joinedAt,
    content: page.content,
    last: page.last,
    empty: page.empty,
    number: page.number,
  }
}
