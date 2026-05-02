import { useQuery } from '@tanstack/react-query'
import { getTopicRoomMembers } from '../../lib/api/topicroom/topicroom.api'

export const useTopicRoomMembers = (roomId: number) =>
  useQuery({
    queryKey: ['topicroom', 'members', roomId],
    enabled: Number.isFinite(roomId) && roomId > 0,
    queryFn: () => getTopicRoomMembers(roomId),
    staleTime: 30_000,
    retry: 0,
  })
