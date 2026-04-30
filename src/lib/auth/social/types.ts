// src/lib/auth/social/types.ts
//
// 소셜 로그인 추상화 인터페이스.
// - Web / Capacitor-Native / RN-Native 구현체가 이 인터페이스를 충족하면
//   상위(훅, 페이지)는 플랫폼을 모른 채 동일하게 호출할 수 있다.
// - BE 네이티브 엔드포인트 계약(accessToken + idToken for Kakao / accessToken for Naver)
//   과 1:1 매칭되도록 토큰 반환 형태를 맞춘다.

export type SocialProviderId = 'kakao' | 'naver'

export interface KakaoNativeTokens {
  accessToken: string
  idToken: string
}

export interface NaverNativeTokens {
  accessToken: string
}

// 네이티브 플랫폼(SDK 기반)의 로그인 계약
export interface NativeSocialAuthProvider {
  loginWithKakao: () => Promise<KakaoNativeTokens>
  loginWithNaver: () => Promise<NaverNativeTokens>
  logoutKakao?: () => Promise<void>
  logoutNaver?: () => Promise<void>
}

// 웹 플랫폼의 로그인 계약 — SDK 대신 리다이렉트 URL 생성만 담당
export interface WebSocialAuthProvider {
  getKakaoAuthUrl: () => string
  getNaverAuthUrl: () => string
}
