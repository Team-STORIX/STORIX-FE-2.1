import { useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { getReaderFavoriteWorks } from '../api/profile-content.api'

export function useProfileFavoriteWorks(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useInfiniteQuery({
    queryKey: ['profile', 'favorite-works'],
    enabled: enabled && isAuthenticated,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getReaderFavoriteWorks({
        page: pageParam as number,
        sort: 'LATEST',
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.result.last ? undefined : (lastPageParam as number) + 1,
  })
}
