import { useQuery } from '@tanstack/react-query'
import { getPopularTopicRooms } from '../api/topicroom.api'

export const usePopularTopicRooms = () =>
  useQuery({
    queryKey: ['topicroom', 'popular'],
    queryFn: getPopularTopicRooms,
  })
