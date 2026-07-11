// src/lib/auth/refresh-token.ts
//
// Shared access-token refresh used by BOTH the Axios 401 interceptor and the
// TopicRoom STOMP connect flow. Extracted so there is a single implementation
// of "read refreshToken → POST /tokens/refresh → persist rotated tokens".
//
// Uses a bare `axios.post` (not the app apiClient) so it never re-enters the
// response interceptor that calls it. Does NOT call clearAuth — the caller
// decides how to react to a failure (Axios clears auth + navigates to login;
// STOMP just stops reconnecting).
import axios from 'axios'
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../storage/secure'
// auth.store never imports this module, so there is no import cycle.
import { useAuthStore } from '../../store/auth.store'

export type TokenRefreshResult =
  | { ok: true; accessToken: string; refreshToken?: string }
  | {
      ok: false
      reason: 'no-refresh-token' | 'request-failed'
      status?: number
      errorName?: string
    }

// Single-flight guard: concurrent callers (e.g. several REST 401s plus a STOMP
// connect firing at once) share one in-flight network request and one rotation.
let inflight: Promise<TokenRefreshResult> | null = null

async function performRefresh(): Promise<TokenRefreshResult> {
  const storedRefreshToken = await getRefreshToken()
  if (!storedRefreshToken) {
    return { ok: false, reason: 'no-refresh-token' }
  }

  try {
    // POST /api/v1/auth/tokens/refresh
    // Body:     { refreshToken: string }
    // Response: { ..., result: { accessToken: string, refreshToken: string } }
    const res = await axios.post(
      `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/tokens/refresh`,
      { refreshToken: storedRefreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )

    const result = res.data?.result
    const newAccessToken: string | undefined = result?.accessToken
    const newRefreshToken: string | undefined = result?.refreshToken

    if (typeof newAccessToken !== 'string' || newAccessToken.length === 0) {
      return {
        ok: false,
        reason: 'request-failed',
        errorName: 'MissingAccessToken',
      }
    }

    // Persist rotated tokens to SecureStore (source of truth) first.
    await setAccessToken(newAccessToken)
    if (typeof newRefreshToken === 'string' && newRefreshToken.length > 0) {
      await setRefreshToken(newRefreshToken)
    }

    // Keep the in-memory Zustand mirror in sync so token-value consumers don't
    // read a stale accessToken. Never logs or stores the raw tokens here.
    useAuthStore.getState().syncAccessToken(newAccessToken)

    return {
      ok: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    const errorName = (err as { name?: string })?.name
    return { ok: false, reason: 'request-failed', status, errorName }
  }
}

/**
 * Refreshes the access token using the stored refresh token, rotating both in
 * SecureStore and the Zustand store. Coalesces concurrent calls into one
 * request. Returns a discriminated result — never throws.
 */
export function refreshAuthTokens(): Promise<TokenRefreshResult> {
  if (!inflight) {
    inflight = performRefresh().finally(() => {
      inflight = null
    })
  }
  return inflight
}
