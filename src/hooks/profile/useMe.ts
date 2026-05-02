import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '../../lib/api/profile/profile.api'
import { useAuthStore } from '../../store/auth.store'
import { useProfileStore } from '../../store/profile.store'

// Query key used by invalidation helpers (e.g. after profile update).
export const ME_QUERY_KEY = ['me'] as const

/**
 * Fetches the current user's profile from GET /api/v1/profile/me.
 *
 * Behaviour:
 *  - Only runs when the user is authenticated (enabled: isAuthenticated).
 *  - On success, writes the result to profileStore so any component can
 *    read it synchronously via useProfileStore without re-triggering the query.
 *  - React Query is the cache/server-state source; profileStore is the
 *    in-memory convenience layer.
 *  - staleTime = 5 min: profile rarely changes mid-session.
 */
export const useMe = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const response = await getMyProfile()
      const me = response.result
      // Side-effect: keep the profile store in sync so screens that don't
      // subscribe to React Query can still read the profile synchronously.
      useProfileStore.getState().setMe(me)
      return me
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1_000, // 5 minutes
    retry: 1,
  })
}
