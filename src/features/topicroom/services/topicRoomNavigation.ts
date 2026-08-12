import { getMyTopicRooms } from '../api/topicroom.api'

export type TopicRoomNavigationParams = {
  keyword?: string | null
  topicRoomName?: string | null
  worksName?: string | null
  worksType?: string | null
  activeUserNumber?: number | null
  thumbnailUrl?: string | null
  lastChatMessage?: string | null
  lastChatTime?: string | null
  isJoined?: boolean | null
}

export function getTopicRoomPreviewRoute(
  roomId: number,
  params: TopicRoomNavigationParams = {},
) {
  return {
    pathname: '/topicroom/preview' as const,
    params: {
      roomId: String(roomId),
      keyword: params.keyword?.trim() || params.worksName?.trim() || '',
      topicRoomName: params.topicRoomName ?? '',
      worksName: params.worksName ?? '',
      worksType: params.worksType ?? '',
      activeUserNumber:
        params.activeUserNumber == null ? '' : String(params.activeUserNumber),
      thumbnailUrl: params.thumbnailUrl ?? '',
      lastChatMessage: params.lastChatMessage ?? '',
      lastChatTime: params.lastChatTime ?? '',
    },
  }
}

export function getTopicRoomChatRoute(
  roomId: number,
  params: TopicRoomNavigationParams = {},
) {
  return {
    pathname: '/topicroom/[roomId]' as const,
    params: {
      roomId: String(roomId),
      topicRoomName: params.topicRoomName ?? '',
      worksName: params.worksName ?? '',
      worksType: params.worksType ?? '',
      activeUserNumber:
        params.activeUserNumber == null ? '' : String(params.activeUserNumber),
    },
  }
}

async function isJoinedTopicRoom(roomId: number): Promise<boolean> {
  let page = 0

  for (let index = 0; index < 10; index += 1) {
    const result = await getMyTopicRooms({
      page,
      size: 50,
      sort: ['topicRoom.lastChatTime,DESC'],
    })
    if (result.content.some((room) => room.topicRoomId === roomId)) return true
    if (result.last || result.empty) return false
    page = (result.number ?? page) + 1
  }

  return false
}

/**
 * Discovery surfaces show the preview only before the user's first join.
 * Endpoints that already return isJoined avoid an extra request; entry points
 * that only know a room id verify membership through GET /topic-rooms/me.
 */
export async function getTopicRoomDiscoveryRoute(
  roomId: number,
  params: TopicRoomNavigationParams = {},
) {
  let isJoined = params.isJoined
  if (isJoined == null) {
    try {
      isJoined = await isJoinedTopicRoom(roomId)
    } catch {
      // A preview remains the safe fallback when membership cannot be checked:
      // its join mutation treats an already-joined response as success.
      isJoined = false
    }
  }
  return isJoined
    ? getTopicRoomChatRoute(roomId, params)
    : getTopicRoomPreviewRoute(roomId, params)
}
