import { useQuery } from '@tanstack/react-query'
import { getFavoriteWorks } from '../../api/feed/readerFavoriteWorks.api'
import type { FavoriteWorkItem } from '../../api/feed/readerFavoriteWorks.api'

export function useFavoriteWorks() {
  return useQuery<FavoriteWorkItem[]>({
    queryKey: ['feed', 'favoriteWorks'],
    queryFn: async () => {
      const all: FavoriteWorkItem[] = []
      let page = 0
      while (true) {
        const res = await getFavoriteWorks({ page, sort: 'LATEST' })
        all.push(...res.result.content)
        if (res.result.last) break
        page++
      }
      return all
    },
    staleTime: 5 * 60 * 1_000,
  })
}
