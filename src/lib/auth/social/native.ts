// src/lib/auth/social/native.ts
// Placeholder — packages are installed; implement each stub in Phase 4F-2.
//
// ─── Kakao (@react-native-seoul/kakao-login v5.4.2) ──────────────────────────
//
//   import { login, logout } from '@react-native-seoul/kakao-login'
//
//   login() → KakaoOAuthToken {
//     accessToken: string
//     refreshToken: string
//     idToken: string          ← always present; only meaningful when OIDC is on
//     accessTokenExpiresAt: Date
//     refreshTokenExpiresAt: Date
//     scopes: string[]
//   }
//   logout() → Promise<string>
//
//   Expo config plugin (app.json plugins array):
//     ["@react-native-seoul/kakao-login", { "kakaoAppKey": "<KAKAO_NATIVE_APP_KEY>" }]
//
// ─── Naver (@react-native-seoul/naver-login v4.2.4) ──────────────────────────
//
//   import NaverLogin from '@react-native-seoul/naver-login'
//
//   NaverLogin.initialize({        ← call once at app entry before login
//     consumerKey: string,
//     consumerSecret: string,
//     appName: string,
//     serviceUrlSchemeIOS: string, ← must match URL scheme in Info.plist
//   })
//   NaverLogin.login() → NaverLoginResponse {
//     isSuccess: boolean
//     successResponse?: { accessToken: string, refreshToken: string, ... }
//     failureResponse?: { message: string, isCancel: boolean, ... }
//   }
//   NaverLogin.logout() → Promise<void>
//
//   Expo config plugin (app.json plugins array):
//     ["@react-native-seoul/naver-login", { "urlScheme": "storixfe21" }]
//
// ─── Apple (@invertase/react-native-apple-authentication v2.5.1) ─────────────
//
//   import appleAuth from '@invertase/react-native-apple-authentication'
//
//   const response = await appleAuth.performRequest({
//     requestedOperation: appleAuth.Operation.LOGIN,
//     requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
//   })
//   const { identityToken } = response  ← send to backend as the auth code
//
//   Android: no native SDK — Apple Sign In on Android uses a web flow.
//   Expo config plugin: "@invertase/react-native-apple-authentication"
//   (requires "Sign In with Apple" capability enabled in Xcode)
//
// ─── Prebuild / Development Build required ───────────────────────────────────
//
//   All three packages contain native code and CANNOT run in Expo Go.
//   Steps before Phase 4F-2:
//     1. Add plugins to app.json (with real app keys — see blocks above)
//     2. npx expo prebuild     (generates ios/ and android/ directories)
//     3. npx expo run:ios      (builds a local dev client with native modules)

import type { NativeSocialAuthProvider } from './types'

export const nativeSocialAuthProvider: NativeSocialAuthProvider = {
  loginWithKakao: async () => {
    throw new Error(
      '[nativeSocialAuthProvider.loginWithKakao] Not implemented.\n' +
        'SDK ready: @react-native-seoul/kakao-login@^5.4.2\n' +
        'Implement in Phase 4F-2. See src/lib/auth/social/native.ts.',
    )
  },

  loginWithNaver: async () => {
    throw new Error(
      '[nativeSocialAuthProvider.loginWithNaver] Not implemented.\n' +
        'SDK ready: @react-native-seoul/naver-login@^4.2.4\n' +
        'Implement in Phase 4F-2. See src/lib/auth/social/native.ts.',
    )
  },

  logoutKakao: async () => {
    // No-op until Phase 4F-2.
  },

  logoutNaver: async () => {
    // No-op until Phase 4F-2.
  },
}
