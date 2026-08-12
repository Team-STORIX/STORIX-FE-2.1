type TopicRoomPreviewParams = {
  keyword?: string | null
  topicRoomName?: string | null
  worksName?: string | null
  worksType?: string | null
  activeUserNumber?: number | null
  thumbnailUrl?: string | null
  lastChatMessage?: string | null
  lastChatTime?: string | null
}

export function getTopicRoomPreviewRoute(
  roomId: number,
  params: TopicRoomPreviewParams = {},
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
