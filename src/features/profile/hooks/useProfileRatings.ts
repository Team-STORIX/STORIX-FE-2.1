import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { getReaderRatings } from '../api/profile-content.api'
import type { RatingCountsMap } from '../types'

export const PROFILE_RATINGS_QUERY_KEY = ['profile', 'ratings'] as const

export function useProfileRatings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<RatingCountsMap>({
    queryKey: PROFILE_RATINGS_QUERY_KEY,
    queryFn: async () => {
      const data = await getReaderRatings()
      return data.result?.ratingCounts ?? {}
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1_000,
    retry: 1,
  })
}
