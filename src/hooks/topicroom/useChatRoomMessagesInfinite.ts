import { useInfiniteQuery } from '@tanstack/react-query'
import { getChatRoomMessages } from '../../lib/api/chat/chat.api'

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
    queryFn: ({ pageParam }) =>
      getChatRoomMessages({ roomId, page: pageParam as number, size, sort }),
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return lastPage.number + 1
    },
  })
}
