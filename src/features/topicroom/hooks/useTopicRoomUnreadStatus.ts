import { useQuery } from '@tanstack/react-query'
import { getTopicRoomUnreadStatus } from '../api/topicroom.api'

export const topicRoomUnreadStatusKey = ['topicroom', 'unread'] as const

export function useTopicRoomUnreadStatus(enabled = true) {
  return useQuery({
    queryKey: topicRoomUnreadStatusKey,
    queryFn: getTopicRoomUnreadStatus,
    enabled,
    staleTime: 15_000,
  })
}
