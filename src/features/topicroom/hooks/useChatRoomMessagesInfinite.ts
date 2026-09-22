import { useInfiniteQuery } from '@tanstack/react-query'
import { getChatRoomMessages } from '../api/chat.api'
import { isTopicRoomNotMemberError } from '../services/topicRoomMembership'

export const useChatRoomMessagesInfinite = (params: {
  roomId: number
  size?: number
  sort?: string
}) => {
  const { roomId, size = 20, sort = 'createdAt,DESC' } = params
  const isValidRoomId = Number.isFinite(roomId) && roomId > 0

  return useInfiniteQuery({
    queryKey: ['chat', 'room', 'messages', roomId, size, sort],
    enabled: isValidRoomId,
    initialPageParam: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    // A non-member 403 will not change on retry; the screen redirects instead.
    retry: (failureCount, error) =>
      !isTopicRoomNotMemberError(error) && failureCount < 1,
    queryFn: ({ pageParam }) =>
      getChatRoomMessages({ roomId, page: pageParam as number, size, sort }),
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return lastPage.number + 1
    },
  })
}
