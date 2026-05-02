import { useQuery } from '@tanstack/react-query'
import { getTodayHomeFeeds } from '../api/home.api'

export const useTodayHomeFeeds = () =>
  useQuery({
    queryKey: ['home', 'feeds', 'today'],
    queryFn: getTodayHomeFeeds,
  })
