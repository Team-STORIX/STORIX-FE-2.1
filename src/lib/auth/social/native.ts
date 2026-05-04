// src/lib/auth/social/native.ts
// Real RN SDK implementations for Kakao and Naver social login.
// Apple Sign In is handled separately — see notes at the bottom.
//
// Requires a Development Build (Expo Go will crash on import).
// Run `npx expo run:ios` / `npx expo run:android` before testing.

import { login as kakaoLogin, logout as kakaoLogout } from '@react-native-seoul/kakao-login'
import NaverLogin from '@react-native-seoul/naver-login'

import type {
  KakaoNativeTokens,
  NativeSocialAuthProvider,
  NaverNativeTokens,
} from './types'

// ─── Naver one-time init guard ────────────────────────────────────────────────
// NaverLogin.initialize() is synchronous and must be called before the first
// login(). Subsequent calls are silently ignored by the guard.

let naverInitialized = false

const ensureNaverInitialized = (): void => {
  if (naverInitialized) return

  const consumerKey = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID
  const consumerSecret = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET
  const appName = process.env.EXPO_PUBLIC_NAVER_APP_NAME ?? 'STORIX'
  // serviceUrlSchemeIOS MUST equal EXPO_PUBLIC_NAVER_URL_SCHEME, which is also
  // passed to the @react-native-seoul/naver-login config plugin in app.config.ts.
  // If they diverge, iOS callbacks will fail silently and login will hang.
  const serviceUrlSchemeIOS =
    process.env.EXPO_PUBLIC_NAVER_URL_SCHEME ?? 'storixfe21'

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      '[NaverLogin] Missing required env vars.\n' +
        '  EXPO_PUBLIC_NAVER_CLIENT_ID and EXPO_PUBLIC_NAVER_CLIENT_SECRET\n' +
        '  must be set in .env before calling Naver login.',
    )
  }

  NaverLogin.initialize({
    consumerKey,
    consumerSecret,
    appName,
    serviceUrlSchemeIOS,
  })

  naverInitialized = true
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const nativeSocialAuthProvider: NativeSocialAuthProvider = {
  // ── Kakao ──────────────────────────────────────────────────────────────────
  loginWithKakao: async (): Promise<KakaoNativeTokens> => {
    if (!process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY) {
      throw new Error(
        '[KakaoLogin] Missing env var: EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY\n' +
          'The Kakao App Key must be set in .env and embedded at build time\n' +
          'via the @react-native-seoul/kakao-login config plugin.',
      )
    }

    const token = await kakaoLogin()

    if (!token.accessToken) {
      throw new Error('[KakaoLogin] SDK returned an empty accessToken.')
    }

    return {
      accessToken: token.accessToken,
      // idToken is typed as string by the SDK but will be '' when Kakao
      // "OpenID Connect" is disabled. Normalise to undefined in that case so
      // the backend endpoint (which accepts idToken as optional) stays clean.
      idToken: token.idToken.length > 0 ? token.idToken : undefined,
    }
  },

  logoutKakao: async (): Promise<void> => {
    try {
      await kakaoLogout()
    } catch (err) {
      // Tolerated: the SDK throws if no session exists, and the local STORIX
      // token is cleared by clearAuth() separately. Surface the failure as a
      // warning rather than swallowing silently so it shows up in logs.
      console.warn('[KakaoLogin] logout SDK error (non-fatal):', err)
    }
  },

  // ── Naver ──────────────────────────────────────────────────────────────────
  loginWithNaver: async (): Promise<NaverNativeTokens> => {
    // Initialise synchronously on first call; subsequent calls are no-ops.
    ensureNaverInitialized()

    const response = await NaverLogin.login()

    if (!response.isSuccess) {
      const failure = response.failureResponse
      if (failure?.isCancel) {
        throw new Error('[NaverLogin] User cancelled the login flow.')
      }
      throw new Error(
        `[NaverLogin] Login failed: ${failure?.message ?? 'unknown error'}`,
      )
    }

    const accessToken = response.successResponse?.accessToken
    if (!accessToken) {
      throw new Error(
        '[NaverLogin] isSuccess was true but successResponse.accessToken is missing.',
      )
    }

    return { accessToken }
  },

  logoutNaver: async (): Promise<void> => {
    // If initialize() was never called the user was never logged in — nothing
    // to log out. Skipping avoids a missing-env-var throw at logout time.
    if (!naverInitialized) return

    try {
      await NaverLogin.logout()
    } catch (err) {
      // Tolerated: local tokens are cleared by clearAuth() regardless. Surface
      // the failure as a warning rather than swallowing silently.
      console.warn('[NaverLogin] logout SDK error (non-fatal):', err)
    }
  },
}

// ─── Apple Sign In ────────────────────────────────────────────────────────────
// Apple login is NOT part of NativeSocialAuthProvider because:
//   1. The interface currently only declares Kakao and Naver.
//   2. Apple Sign In on Android uses a web flow, not a native SDK.
//   3. The backend endpoint for Apple may differ from Kakao/Naver native.
//
// Implement Apple Sign In as a dedicated hook (e.g. useAppleLogin) that calls
// @invertase/react-native-apple-authentication directly and posts the
// identityToken to the backend, analogous to useKakaoLogin.
