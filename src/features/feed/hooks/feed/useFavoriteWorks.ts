import { useQuery } from '@tanstack/react-query'
import { getFavoriteWorks } from '../../api/feed/readerFavoriteWorks.api'

export function useFavoriteWorks() {
  return useQuery({
    queryKey: ['feed', 'favoriteWorks'],
    queryFn: () => getFavoriteWorks({ page: 0, sort: 'LATEST', size: 100 }),
    staleTime: 5 * 60 * 1_000,
  })
}
