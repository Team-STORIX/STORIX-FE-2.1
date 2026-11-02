import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { getGenreStats } from '../api/profile.api'
import type { GenreStatItem } from '../api/profile.api'

export const PROFILE_GENRE_STATS_QUERY_KEY = ['profile', 'genre-stats'] as const

export function useProfileGenreStats() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<GenreStatItem[]>({
    queryKey: PROFILE_GENRE_STATS_QUERY_KEY,
    queryFn: async () => {
      const data = await getGenreStats()
      return (data.result ?? []).filter((item) => item.score > 0)
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1_000,
    retry: 1,
  })
}
