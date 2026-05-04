import { useQuery } from '@tanstack/react-query'
import { getTodayTopicRooms } from '../api/topicroom.api'

export const useTodayTopicRooms = () =>
  useQuery({
    queryKey: ['topicroom', 'today'],
    queryFn: getTodayTopicRooms,
    staleTime: 30_000,
    retry: 0,
  })
