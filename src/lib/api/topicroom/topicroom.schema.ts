// src/lib/api/topicroom/topicroom.schema.ts
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

/** Spring Slice/Page 형태(무한스크롤/페이지네이션용) */
export const SliceSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    number: z.number(),
    last: z.boolean(),
    empty: z.boolean(),
    first: z.boolean().optional(),
    size: z.number().optional(),
    numberOfElements: z.number().optional(),
    pageable: z.any().optional(),
    sort: z.any().optional(),
  })

/** TopicRoom item (today/popular/search/me 공통) */
export const TopicRoomItemSchema = z.object({
  topicRoomId: z.number(),
  topicRoomName: z.string(),
  worksType: z.string().nullish(),
  worksName: z.string(),
  thumbnailUrl: z.string().nullish(),
  activeUserNumber: z.number().nullish(),
  lastChatTime: z.string().nullish(),
  isJoined: z.boolean().nullish(),
})

export type TopicRoomItem = z.infer<typeof TopicRoomItemSchema>

/** 토픽룸 생성 응답: result가 number|string 형태로 올 수 있음 */
export const TopicRoomIdSchema = z.preprocess((v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : v
}, z.number())

/** 토픽룸 검색: swagger가 result.result.content 로 내려오는 구조 */
export const TopicRoomSearchWrappedSchema = z.object({
  result: z.object({
    content: z.array(TopicRoomItemSchema),
  }),
})

/** 참여 중인 토픽룸: result가 Page/Slice 형태 */
export const MyTopicRoomSliceSchema = SliceSchema(TopicRoomItemSchema)
export type MyTopicRoomSlice = z.infer<typeof MyTopicRoomSliceSchema>

/** 토픽룸 참여자 목록 */
export const TopicRoomMemberSchema = z
  .object({
    userId: z.preprocess((v) => Number(v), z.number()),
    nickName: z.string().optional(),
    nickname: z.string().optional(),
    profileImageUrl: z.string().nullable().optional(),
    profileImage: z.string().nullable().optional(),
  })
  .transform((m) => ({
    userId: m.userId,
    nickName: m.nickName ?? m.nickname ?? '',
    profileImageUrl: m.profileImageUrl ?? m.profileImage ?? null,
  }))

/** 토픽룸 사용자 신고 (POST /api/v1/topic-rooms/{roomId}/report) */
export const TopicRoomReportRequestSchema = z.object({
  reportedUserId: z.number(),
  reason: z.string(),
  otherReason: z.string().nullish(),
})

export type TopicRoomReportRequest = z.infer<
  typeof TopicRoomReportRequestSchema
>

export type TopicRoomMember = z.infer<typeof TopicRoomMemberSchema>
export const TopicRoomSearchSliceSchema = SliceSchema(TopicRoomItemSchema)
export type TopicRoomSearchSlice = z.infer<typeof TopicRoomSearchSliceSchema>
export const TopicRoomReportResultSchema = z.string()
export type TopicRoomReportResult = z.infer<typeof TopicRoomReportResultSchema>
