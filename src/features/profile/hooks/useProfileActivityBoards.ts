import { useInfiniteQuery } from '@tanstack/react-query'
import { getProfileActivityBoards } from '../api/profile-activity.api'

export function useProfileActivityBoards(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['profile', 'activity', 'boards'],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getProfileActivityBoards({
        page: pageParam as number,
        sort: 'LATEST',
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.last ? undefined : (lastPageParam as number) + 1,
  })
}
