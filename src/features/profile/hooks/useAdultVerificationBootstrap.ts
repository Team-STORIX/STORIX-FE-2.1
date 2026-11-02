import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '../../../store/auth.store'
import { ADULT_VERIFICATION_STATUS_QUERY_KEY } from '../../../store/adultVerification.store'
import { getAdultVerificationStatus } from '../api'

export { ADULT_VERIFICATION_STATUS_QUERY_KEY }

/**
 * Loads the verification status once per session so adult masks reflect the
 * user's real state before they ever open settings. The API call itself
 * writes the result into the adult verification store.
 */
export const useAdultVerificationBootstrap = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ADULT_VERIFICATION_STATUS_QUERY_KEY,
    queryFn: () => getAdultVerificationStatus({ refreshOnVerified: false }),
    enabled: isAuthenticated,
    staleTime: Infinity,
  })
}
