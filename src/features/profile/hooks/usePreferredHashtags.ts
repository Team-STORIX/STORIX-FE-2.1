import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { getPreferredHashtags } from '../api/profile-content.api'

export const PROFILE_HASHTAGS_QUERY_KEY = ['profile', 'hashtags'] as const

export function usePreferredHashtags() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<Record<number, string>>({
    queryKey: PROFILE_HASHTAGS_QUERY_KEY,
    queryFn: getPreferredHashtags,
    enabled: isAuthenticated,
    staleTime: 60 * 1_000,
    retry: 1,
  })
}
