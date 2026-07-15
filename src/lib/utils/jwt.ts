// src/lib/utils/jwt.ts
// atob is available in Hermes (RN 0.71+). Safe to use in this project (RN 0.81.5).

export const getUserIdFromJwt = (
  token: string | null | undefined,
): number | null => {
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

    const data = JSON.parse(json) as Record<string, unknown>

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
  } catch {
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
