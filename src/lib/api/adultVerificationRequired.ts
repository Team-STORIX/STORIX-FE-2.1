// Kept free of feature imports so axios-instance can use it without creating a
// circular dependency (adultVerification.api.ts imports apiClient).

import type { AdultVerificationContext } from '../../store/adultVerification.store'

/** 403 returned by content endpoints when the user has not completed adult verification. */
export const ADULT_VERIFICATION_REQUIRED_CODE = 'ADULT_VERIFICATION_ERROR_008'

export const isAdultVerificationRequiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false

  const response = (
    error as { response?: { status?: unknown; data?: { code?: unknown } } }
  ).response

  return (
    response?.status === 403 &&
    response.data?.code === ADULT_VERIFICATION_REQUIRED_CODE
  )
}

/**
 * Picks the prompt copy from the request path of the rejected call. Only the
 * write endpoints and topic rooms have their own wording; every read (works,
 * reviews, feed posts, likes, replies, favorites) uses the "read" copy.
 */
export const getAdultVerificationContext = (
  url: string | undefined,
): AdultVerificationContext => {
  if (!url) return 'read'
  if (/\/plus\/reader\/review/.test(url)) return 'writeReview'
  if (/\/plus\/reader\/board/.test(url)) return 'writePost'
  if (/\/topic-rooms|\/chat\//.test(url)) return 'topicroom'
  return 'read'
}
