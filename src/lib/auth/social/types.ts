// src/lib/auth/social/types.ts
//
// 소셜 로그인 추상화 인터페이스.
// - Web / Capacitor-Native / RN-Native 구현체가 이 인터페이스를 충족하면
//   상위(훅, 페이지)는 플랫폼을 모른 채 동일하게 호출할 수 있다.
// - BE 네이티브 엔드포인트 계약(accessToken + idToken for Kakao / accessToken for Naver)
//   과 1:1 매칭되도록 토큰 반환 형태를 맞춘다.

export type SocialProviderId = 'kakao' | 'naver' | 'apple'

export interface KakaoNativeTokens {
  accessToken: string
  // idToken is present only when "OpenID Connect" is enabled in the Kakao
  // Developer Console. The SDK always returns a string but it will be empty
  // when OIDC is off. We normalise to undefined so callers can safely omit it.
  idToken?: string
}

export interface NaverNativeTokens {
  accessToken: string
  refreshToken: string
}

// Apple Sign In response — the backend endpoint accepts a single `code` value
// (either authorizationCode preferred, or identityToken fallback), matching
// the 2.0 web-redirect contract.
export interface AppleNativeTokens {
  // Short-lived one-time token, preferred by the backend. May be null when
  // Apple omits it (rare but possible on repeat sign-ins).
  authorizationCode: string | null
  // JWT signed by Apple. Always present on a successful sign-in.
  identityToken: string
}

// 네이티브 플랫폼(SDK 기반)의 로그인 계약
export interface NativeSocialAuthProvider {
  loginWithKakao: () => Promise<KakaoNativeTokens>
  loginWithNaver: () => Promise<NaverNativeTokens>
  loginWithApple: () => Promise<AppleNativeTokens>
  logoutKakao?: () => Promise<void>
  logoutNaver?: () => Promise<void>
}

// 웹 플랫폼의 로그인 계약 — SDK 대신 리다이렉트 URL 생성만 담당
export interface WebSocialAuthProvider {
  getKakaoAuthUrl: () => string
  getNaverAuthUrl: () => string
}
