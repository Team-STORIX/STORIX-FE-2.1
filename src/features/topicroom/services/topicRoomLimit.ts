import { getMyTopicRooms } from '../api/topicroom.api'
import type { TopicRoomItem } from '../api/topicroom.schema'

export const MAX_JOINED_TOPIC_ROOMS = 9
const LIMIT_CHECK_PAGE_SIZE = 50

export class TopicRoomParticipationLimitError extends Error {
  constructor() {
    super('Maximum joined topic room count exceeded')
    this.name = 'TopicRoomParticipationLimitError'
  }
}

export const isTopicRoomParticipationLimitError = (
  error: unknown,
): error is TopicRoomParticipationLimitError => {
  if (
    error instanceof TopicRoomParticipationLimitError ||
    (error instanceof Error && error.name === 'TopicRoomParticipationLimitError')
  ) {
    return true
  }

  const responseCode = (error as any)?.response?.data?.code
  return responseCode === 'TOPIC_ROOM_ERROR_002'
}

export const isTopicRoomForbiddenWordError = (error: unknown): boolean => {
  const responseCode = (error as any)?.response?.data?.code
  return responseCode === 'TOPIC_ROOM_ERROR_004'
}

const getJoinedTopicRoomsForLimit = async (): Promise<TopicRoomItem[]> => {
  const all: TopicRoomItem[] = []
  let page = 0

  for (let i = 0; i < 10; i += 1) {
    const res = await getMyTopicRooms({
      page,
      size: LIMIT_CHECK_PAGE_SIZE,
      sort: ['topicRoom.lastChatTime,DESC'],
    })
    all.push(...(res.content ?? []))
    if (res.last || res.empty) break
    page = (res.number ?? page) + 1
  }

  return all
}

export const assertCanJoinTopicRoom = async (
  roomId?: number,
): Promise<{ alreadyJoined: boolean }> => {
  const joinedRooms = await getJoinedTopicRoomsForLimit()
  const alreadyJoined =
    roomId != null && joinedRooms.some((room) => room.topicRoomId === roomId)

  if (!alreadyJoined && joinedRooms.length >= MAX_JOINED_TOPIC_ROOMS) {
    throw new TopicRoomParticipationLimitError()
  }

  return { alreadyJoined }
}

export const assertCanCreateTopicRoom = async (): Promise<void> => {
  await assertCanJoinTopicRoom()
}
