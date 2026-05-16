// src/features/topicroom/api/topicroom.api.ts
import { z } from 'zod'
import { apiClient } from '../../../lib/api/axios-instance'
import {
  ApiEnvelopeSchema,
  MyTopicRoomSliceSchema,
  TopicRoomIdSchema,
  TopicRoomItemSchema,
  TopicRoomMemberSchema,
  TopicRoomReportRequestSchema,
  TopicRoomReportResultSchema,
  TopicRoomSearchSliceSchema,
  TopicRoomSearchWrappedSchema,
} from './topicroom.schema'

export type { TopicRoomItem, MyTopicRoomSlice, TopicRoomMember } from './topicroom.schema'

const AnyEnvelopeSchema = ApiEnvelopeSchema(z.any())
const TopicRoomListEnvelopeSchema = ApiEnvelopeSchema(z.array(TopicRoomItemSchema))

// POST /api/v1/topic-rooms
export async function createTopicRoom(body: {
  worksId: number
  topicRoomName: string
}) {
  const res = await apiClient.post('/api/v1/topic-rooms', body, {
    headers: { accept: '*/*' },
  })
  return ApiEnvelopeSchema(TopicRoomIdSchema).parse(res.data).result
}

// POST /api/v1/topic-rooms/{roomId}/join
// 409 = already a member (absorbed by callers via useJoinTopicRoom)
export async function joinTopicRoom(roomId: number) {
  const res = await apiClient.post(`/api/v1/topic-rooms/${roomId}/join`, null, {
    headers: { accept: '*/*' },
  })
  // Callers only act on the HTTP outcome (2xx = joined, 409 = already a
  // member, handled by useJoinTopicRoom); the success body is never read.
  // Strictly parsing the envelope here threw a ZodError on the genuine
  // first join whenever the success body shape differed from the envelope,
  // surfacing a false "입장 실패" toast even though the join succeeded —
  // while the second tap's 409 bypassed parsing and "worked". Parse
  // leniently so a 2xx is always treated as success.
  const parsed = AnyEnvelopeSchema.safeParse(res.data)
  return parsed.success ? parsed.data : res.data
}

// DELETE /api/v1/topic-rooms/{roomId}/leave
export async function leaveTopicRoom(roomId: number) {
  const res = await apiClient.delete(`/api/v1/topic-rooms/${roomId}/leave`, {
    headers: { accept: '*/*' },
  })
  return AnyEnvelopeSchema.parse(res.data)
}

// GET /api/v1/topic-rooms/today
export async function getTodayTopicRooms() {
  const res = await apiClient.get('/api/v1/topic-rooms/today', {
    headers: { accept: '*/*' },
  })
  return TopicRoomListEnvelopeSchema.parse(res.data).result
}

// GET /api/v1/topic-rooms/popular
export async function getPopularTopicRooms() {
  const res = await apiClient.get('/api/v1/topic-rooms/popular', {
    headers: { accept: '*/*' },
  })
  return TopicRoomListEnvelopeSchema.parse(res.data).result
}

// GET /api/v1/topic-rooms/search
// Server returns result.result.content (double-nested). Returns flat content array.
export async function searchTopicRooms(params: {
  keyword: string
  page?: number
  size?: number
  sort?: string[]
}) {
  const res = await apiClient.get('/api/v1/topic-rooms/search', {
    params: {
      keyword: params.keyword,
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? ['topicRoomName,ASC'],
    },
    headers: { accept: '*/*' },
  })
  return ApiEnvelopeSchema(TopicRoomSearchWrappedSchema)
    .parse(res.data)
    .result.result.content
}

// Wraps searchTopicRooms in a Slice-shaped object for useInfiniteQuery pagination.
export async function searchTopicRoomsSlice(params: {
  keyword: string
  page?: number
  size?: number
  sort?: string[]
}) {
  const page = params.page ?? 0
  const size = params.size ?? 20
  const content = await searchTopicRooms({ ...params, page, size })
  return TopicRoomSearchSliceSchema.parse({
    content,
    number: page,
    empty: content.length === 0,
    last: content.length < size,
  })
}

// GET /api/v1/topic-rooms/{roomId}/members
export async function getTopicRoomMembers(roomId: number) {
  const res = await apiClient.get(`/api/v1/topic-rooms/${roomId}/members`, {
    headers: { accept: '*/*' },
  })
  return ApiEnvelopeSchema(z.array(TopicRoomMemberSchema)).parse(res.data).result
}

// GET /api/v1/topic-rooms/me
export async function getMyTopicRooms(params?: {
  page?: number
  size?: number
  sort?: string[]
}) {
  const res = await apiClient.get('/api/v1/topic-rooms/me', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 3,
      sort: params?.sort ?? ['topicRoom.lastChatTime,DESC'],
    },
    headers: { accept: '*/*' },
  })
  return ApiEnvelopeSchema(MyTopicRoomSliceSchema).parse(res.data).result
}

// Searches by worksName and returns the topicRoomId of the matching room, or null.
// Comparison is tolerant: exact match → trim+case-insensitive match → single-result fallback.
// Without this leniency, a transient whitespace / case difference between the works detail
// payload and the search payload caused the first entry tap to silently return null even
// when a room existed (which the second tap would then "succeed" on by user retry).
export async function findTopicRoomIdByWorksName(
  worksName: string,
): Promise<number | null> {
  const trimmed = worksName.trim()
  if (!trimmed) return null

  const list = await searchTopicRooms({ keyword: trimmed, page: 0, size: 20 })
  if (list.length === 0) return null

  const exact = list.find((r) => r.worksName === worksName)
  if (exact) return exact.topicRoomId

  const target = trimmed.toLowerCase()
  const fuzzy = list.find(
    (r) => (r.worksName ?? '').trim().toLowerCase() === target,
  )
  if (fuzzy) return fuzzy.topicRoomId

  // If the keyword search returned a single result, treat it as the match —
  // the backend already ranked it and there is no other candidate.
  if (list.length === 1) return list[0].topicRoomId

  return null
}

// Searches by keyword and finds the item with a matching topicRoomId.
export async function findTopicRoomInfoById(keyword: string, topicRoomId: number) {
  const list = await searchTopicRooms({ keyword, page: 0, size: 20 })
  return list.find((r) => r.topicRoomId === topicRoomId) ?? null
}

// POST /api/v1/topic-rooms/{roomId}/report
export async function reportTopicRoomUser(
  roomId: number,
  body: { reportedUserId: number; reason: string; otherReason?: string | null },
) {
  const parsedBody = TopicRoomReportRequestSchema.parse(body)
  const res = await apiClient.post(
    `/api/v1/topic-rooms/${roomId}/report`,
    parsedBody,
    { headers: { accept: '*/*' } },
  )
  return ApiEnvelopeSchema(TopicRoomReportResultSchema).parse(res.data).result
}
