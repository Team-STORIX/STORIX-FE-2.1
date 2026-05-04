import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { getReaderFavoriteWorks } from '../api/profile-content.api'
import type { FavoriteWorkPreview } from '../types'

export const PROFILE_FAVORITE_WORKS_QUERY_KEY = [
  'profile',
  'favorite-works-preview',
] as const

type FavoriteWorksPreviewResult = {
  count: number
  works: FavoriteWorkPreview[]
}

export function useProfileFavoriteWorksPreview() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<FavoriteWorksPreviewResult>({
    queryKey: PROFILE_FAVORITE_WORKS_QUERY_KEY,
    queryFn: async () => {
      const data = await getReaderFavoriteWorks({ page: 0, sort: 'LATEST' })

      return {
        count: data.totalFavoriteWorksCount ?? 0,
        works: (data.result.content ?? []).slice(0, 10).map((work) => ({
          id: work.worksId,
          title: work.worksName,
          author: work.artistName,
          imageUrl: work.thumbnailUrl ?? null,
        })),
      }
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1_000,
    retry: 1,
  })
}
