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
 * True when a status response turns an unverified user into a verified one.
 * Screens that failed with 403 before this point need their data refetched.
 */
export const isNewlyVerified = (
  previousState: string | null | undefined,
  nextState: string,
): boolean => nextState === 'VERIFIED' && previousState !== 'VERIFIED'

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
  // Only the collection POST creates a room; /topic-rooms/{id}/... is access.
  if (/\/topic-rooms\/?(\?|$)/.test(url)) return 'createTopicRoom'
  if (/\/topic-rooms|\/chat\//.test(url)) return 'topicroom'
  return 'read'
}
