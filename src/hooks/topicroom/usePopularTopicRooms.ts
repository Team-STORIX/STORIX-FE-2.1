import { useQuery } from '@tanstack/react-query'
import { getPopularTopicRooms } from '../../lib/api/topicroom/topicroom.api'

export const usePopularTopicRooms = () =>
  useQuery({
    queryKey: ['topicroom', 'popular'],
    queryFn: getPopularTopicRooms,
  })
