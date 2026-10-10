// src/lib/utils/jwt.ts
// atob is available in Hermes (RN 0.71+). Safe to use in this project (RN 0.81.5).

// Decodes a JWT payload (no signature verification — client-side only).
const decodeJwtPayload = (
  token: string | null | undefined,
): Record<string, unknown> | null => {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')

    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )

    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export const getUserIdFromJwt = (
  token: string | null | undefined,
): number | null => {
  const data = decodeJwtPayload(token)
  if (!data) return null

  {
    const candidates = [
      data.userId,
      data.id,
      data.memberId,
      data.readerId,
      data.sub,
    ]

    for (const v of candidates) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) return n
    }

    return null
  }
}

/**
 * Validates that two JWT tokens belong to the same user by comparing their userId claims.
 * Returns true if both tokens have valid, matching userIds; false otherwise.
 *
 * Use this to prevent token mismatch attacks where accessToken and refreshToken
 * belong to different accounts.
 */
export const areTokensFromSameUser = (
  token1: string | null | undefined,
  token2: string | null | undefined,
): boolean => {
  const userId1 = getUserIdFromJwt(token1)
  const userId2 = getUserIdFromJwt(token2)

  if (!userId1 || !userId2) return false

  return userId1 === userId2
}

// Returns the JWT `exp` claim (seconds since epoch), or null when the token is
// absent, not a JWT, or has no numeric exp.
export const getJwtExpSeconds = (
  token: string | null | undefined,
): number | null => {
  const data = decodeJwtPayload(token)
  if (!data) return null
  const exp = Number(data.exp)
  return Number.isFinite(exp) && exp > 0 ? exp : null
}

// Seconds until the token expires (negative if already expired). null when no
// exp claim is available.
export const getJwtSecondsUntilExpiry = (
  token: string | null | undefined,
): number | null => {
  const exp = getJwtExpSeconds(token)
  if (exp == null) return null
  return exp - Math.floor(Date.now() / 1000)
}

// True when the token is already expired or falls within `skewSec` of expiry.
// Signature is NOT verified — this only drives proactive client-side refresh.
// A token with no decodable exp returns false (undecidable → let the server
// decide), so opaque/non-JWT tokens are never force-refreshed here.
export const isJwtExpiringSoon = (
  token: string | null | undefined,
  skewSec = 45,
): boolean => {
  const secs = getJwtSecondsUntilExpiry(token)
  if (secs == null) return false
  return secs <= skewSec
}
