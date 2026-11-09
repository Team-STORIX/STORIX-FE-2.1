import { useInfiniteQuery } from '@tanstack/react-query'
import { getProfileActivityBookmarks } from '../api/profile-activity.api'

export function useProfileActivityBookmarks(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['profile', 'activity', 'bookmarks'],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getProfileActivityBookmarks({
        page: pageParam as number,
        sort: 'LATEST',
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.last ? undefined : (lastPageParam as number) + 1,
  })
}
