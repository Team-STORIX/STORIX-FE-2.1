import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '../../../store/auth.store'
import { getAdultVerificationStatus } from '../api'

export const ADULT_VERIFICATION_STATUS_QUERY_KEY = [
  'adult-verification',
  'me',
] as const

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
