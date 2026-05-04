import { useInfiniteQuery } from '@tanstack/react-query'
import { getProfileActivityLikes } from '../api/profile-activity.api'

export function useProfileActivityLikes(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['profile', 'activity', 'likes'],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getProfileActivityLikes({
        page: pageParam as number,
        sort: 'LATEST',
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.last ? undefined : (lastPageParam as number) + 1,
  })
}
