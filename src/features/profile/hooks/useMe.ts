import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '../api/profile.api'
import { useAuthStore } from '../../../store/auth.store'
import { useProfileStore } from '../store/profile.store'

export const ME_QUERY_KEY = ['me'] as const

export const useMe = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const response = await getMyProfile()
      const me = response.result
      useProfileStore.getState().setMe(me)
      if (__DEV__) {
        // [NOTIFICATION_TEST_DEBUG] temporary — remove after push E2E QA.
        // eslint-disable-next-line no-console
        console.log('[NOTIFICATION_TEST_DEBUG] profile userId', me.userId)
      }
      return me
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1_000,
    retry: 1,
  })
}
