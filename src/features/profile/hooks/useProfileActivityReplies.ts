import { useInfiniteQuery } from '@tanstack/react-query'
import { getProfileActivityReplies } from '../api/profile-activity.api'

export function useProfileActivityReplies(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['profile', 'activity', 'replies'],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getProfileActivityReplies({
        page: pageParam as number,
        sort: 'LATEST',
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.last ? undefined : (lastPageParam as number) + 1,
  })
}
