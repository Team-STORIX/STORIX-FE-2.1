import * as SecureStore from 'expo-secure-store'

// Storage keys — single source of truth for all SecureStore entries.
const KEYS = {
  ACCESS_TOKEN: 'storix.accessToken',
  // TODO(Phase 3B — backend contract required):
  //   The 2.0 backend delivers refreshToken as an HTTP-only cookie (withCredentials).
  //   In RN there is no cookie jar, so refreshToken must be stored explicitly.
  //   Before wiring the axios refresh interceptor, confirm with backend that:
  //     - POST /api/v1/auth/oauth/kakao-native/login  returns { refreshToken } in body
  //     - POST /api/v1/auth/oauth/naver-native/login  returns { refreshToken } in body
  //     - POST /api/v1/auth/tokens/refresh            accepts Authorization: Bearer <refreshToken>
  //       OR returns refreshToken in body so the client can rotate it.
  //   Until confirmed, setRefreshToken / getRefreshToken are ready but unused.
  REFRESH_TOKEN: 'storix.refreshToken',
  ONBOARDING_TOKEN: 'storix.onboardingToken',
} as const

// ---------- accessToken ----------

export const getAccessToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(KEYS.ACCESS_TOKEN)

export const setAccessToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token)

export const removeAccessToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN)

// ---------- refreshToken ----------

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(KEYS.REFRESH_TOKEN)

export const setRefreshToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token)

export const removeRefreshToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN)

// ---------- onboardingToken ----------
// Temporary token issued before signup is complete. Cleared after setAccessToken.

export const getOnboardingToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(KEYS.ONBOARDING_TOKEN)

export const setOnboardingToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(KEYS.ONBOARDING_TOKEN, token)

export const removeOnboardingToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(KEYS.ONBOARDING_TOKEN)

// ---------- compound ----------

/**
 * Wipes all auth tokens from SecureStore.
 * Call on logout or clearAuth.
 */
export const clearAuthTokens = (): Promise<void[]> =>
  Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.ONBOARDING_TOKEN),
  ])
