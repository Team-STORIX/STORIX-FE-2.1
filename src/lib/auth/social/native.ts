// src/lib/auth/social/native.ts
// Real RN SDK implementations for Kakao and Naver social login.
// Apple Sign In is handled separately — see notes at the bottom.
//
// Requires a Development Build (Expo Go will crash on import).
// Run `npx expo run:ios` / `npx expo run:android` before testing.

import { NativeModules, Platform } from 'react-native'
import { login as kakaoLogin, logout as kakaoLogout } from '@react-native-seoul/kakao-login'
import NaverLogin from '@react-native-seoul/naver-login'
import { appleAuth } from '@invertase/react-native-apple-authentication'

import type {
  AppleNativeTokens,
  KakaoNativeTokens,
  NativeSocialAuthProvider,
  NaverNativeTokens,
} from './types'

// ─── Naver one-time init guard ────────────────────────────────────────────────
// NaverLogin.initialize() is synchronous and must be called before the first
// login(). Subsequent calls are silently ignored by the guard.

let naverInitialized = false

const assertKakaoNativeModule = (): void => {
  if (NativeModules.RNKakaoLogins) return

  throw new Error(
    '카카오 로그인을 사용할 수 없는 앱 빌드입니다. 앱을 다시 설치한 뒤 시도해 주세요.',
  )
}

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
    assertKakaoNativeModule()

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

    if (__DEV__) {
      console.log('[KakaoLogin] SDK token received:', {
        hasAccessToken: !!token.accessToken,
        hasIdToken: !!token.idToken,
      })
    }

    return {
      accessToken: token.accessToken,
      idToken: token.idToken || undefined,
    }
  },

  logoutKakao: async (): Promise<void> => {
    if (!NativeModules.RNKakaoLogins) return

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
    const refreshToken = response.successResponse?.refreshToken

    if (!accessToken) {
      throw new Error(
        '[NaverLogin] isSuccess was true but successResponse.accessToken is missing.',
      )
    }

    if (!refreshToken) {
      throw new Error(
        '[NaverLogin] isSuccess was true but successResponse.refreshToken is missing.',
      )
    }

    return { accessToken, refreshToken }
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

  // ── Apple ──────────────────────────────────────────────────────────────────
  // Native Sign In with Apple via @invertase/react-native-apple-authentication.
  // iOS-only: the SDK is not available on Android, so callers must gate the
  // entry point on Platform.OS === 'ios'. The backend exchange endpoint is the
  // same one 2.0 used (GET /api/v1/auth/oauth/apple/login?code=…) and accepts
  // either authorizationCode (preferred) or identityToken as the `code` value.
  loginWithApple: async (): Promise<AppleNativeTokens> => {
    if (Platform.OS !== 'ios') {
      throw new Error('[AppleLogin] Apple Sign In is only available on iOS.')
    }

    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    })

    if (!response.identityToken) {
      throw new Error('[AppleLogin] SDK returned no identityToken.')
    }

    return {
      authorizationCode: response.authorizationCode,
      identityToken: response.identityToken,
    }
  },
}
