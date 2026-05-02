import { useQuery } from '@tanstack/react-query'
import { findTopicRoomInfoById } from '../api/topicroom.api'

export const useTopicRoomInfoById = (params: {
  keyword: string
  topicRoomId: number
}) =>
  useQuery({
    queryKey: ['topicroom', 'info', params.keyword, params.topicRoomId],
    enabled: !!params.keyword && !!params.topicRoomId,
    queryFn: () => findTopicRoomInfoById(params.keyword, params.topicRoomId),
  })
