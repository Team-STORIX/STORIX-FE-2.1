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
// The backend now returns { joinedDays, activeUserNumber, messages: <page> },
// but older deployments may return either { joinedAt, messages } or the page
// directly. We accept all shapes and collapse them into a single normalized
// page so the screen/infinite-query layer never branches on shape.
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

  // Wrapped shape: { joinedDays, activeUserNumber, messages }. Legacy direct
  // shape: the page itself.
  const isWrapped = 'messages' in result
  const page = isWrapped ? result.messages : result
  const joinedDays = isWrapped ? result.joinedDays ?? null : null
  const activeUserNumber =
    isWrapped && typeof result.activeUserNumber === 'number'
      ? result.activeUserNumber
      : null

  if (__DEV__) {
    console.log('[TOPICROOM_DATE] history', {
      roomId: params.roomId,
      joinedDays,
      activeUserNumber,
    })
  }

  return {
    joinedDays,
    activeUserNumber,
    content: page.content,
    last: page.last,
    empty: page.empty,
    number: page.number,
  }
}
