// Kept free of API imports so it can be unit tested with node --test.

/** 400: the id is the caller's own. Use the /profile/me family instead. */
export const PROFILE_SELF_LOOKUP_CODE = 'PROFILE_ERROR_002'
/** 403: the caller has blocked this user. */
export const BLOCKED_USER_CONTENT_CODE = 'BLOCK_ERROR_003'
/** 404: the account was withdrawn or suspended. */
export const INVALID_ACCOUNT_CODE = 'USER_ERROR_007'

export type OtherUserProfileError = 'self' | 'blocked' | 'unavailable'

/**
 * Maps a rejected /profile/other-users/{userId} call (backend PR #304) to the
 * state the screen should show. Every endpoint of that family shares these
 * three codes; anything else returns null and is treated as a generic failure.
 */
export const getOtherUserProfileError = (error: unknown): OtherUserProfileError | null => {
  if (typeof error !== 'object' || error === null) return null

  const response = (
    error as { response?: { status?: unknown; data?: { code?: unknown } } }
  ).response

  switch (response?.data?.code) {
    case PROFILE_SELF_LOOKUP_CODE:
      return response.status === 400 ? 'self' : null
    case BLOCKED_USER_CONTENT_CODE:
      return response.status === 403 ? 'blocked' : null
    case INVALID_ACCOUNT_CODE:
      return response.status === 404 ? 'unavailable' : null
    default:
      return null
  }
}
