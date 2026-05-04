// src/features/topicroom/api/chat.api.ts
import { apiClient } from '../../../lib/api/axios-instance'
import { ApiEnvelopeSchema, ChatRoomMessagePageSchema } from './chat.schema'

const MessagesEnvelopeSchema = ApiEnvelopeSchema(ChatRoomMessagePageSchema)

// GET /api/v1/chat/rooms/{roomId}/messages
export async function getChatRoomMessages(params: {
  roomId: number
  page?: number
  size?: number
  sort?: string
}) {
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
  return MessagesEnvelopeSchema.parse(res.data).result
}
