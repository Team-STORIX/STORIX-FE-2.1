// Kept free of feature imports so axios-instance can use it and node --test can load it.

/** 429 from any authenticated API once the per-user request limit is hit (backend #346). */
export const RATE_LIMITED_CODE = 'COMMON_ERROR_012'

export const RATE_LIMITED_MESSAGE = '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'

/**
 * Any 429 counts: a proxy in front of the API can answer one without the JSON
 * body, and the user should get the same notice either way.
 */
export const isRateLimitedError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false

  const response = (
    error as { response?: { status?: unknown; data?: { code?: unknown } } }
  ).response

  return response?.status === 429 || response?.data?.code === RATE_LIMITED_CODE
}
