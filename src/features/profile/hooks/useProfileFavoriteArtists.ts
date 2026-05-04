import { useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { getReaderFavoriteArtists } from '../api/profile-content.api'

export function useProfileFavoriteArtists(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useInfiniteQuery({
    queryKey: ['profile', 'favorite-artists'],
    enabled: enabled && isAuthenticated,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getReaderFavoriteArtists({
        page: pageParam as number,
        sort: 'LATEST',
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.result.last ? undefined : (lastPageParam as number) + 1,
  })
}
