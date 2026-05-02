import { useQuery } from '@tanstack/react-query'
import { getTodayHomeFeeds } from '../../lib/api/homeFeed/homeFeed.api'

export const useTodayHomeFeeds = () =>
  useQuery({
    queryKey: ['home', 'feeds', 'today'],
    queryFn: getTodayHomeFeeds,
  })
