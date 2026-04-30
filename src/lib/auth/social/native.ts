// src/lib/auth/social/native.ts
// Placeholder — real implementations require native SDK installation.
//
// TODO(Phase native-login): Replace each stub with the real RN SDK call.
//
//   Kakao:  npm install @react-native-kakao/core @react-native-kakao/user
//           + iOS: KakaoSDK pod + AppDelegate init
//           + Android: build.gradle + strings.xml
//
//   Naver:  npm install @react-native-seoul/naver-login
//           + iOS: NaverThirdPartyLogin pod + URL scheme
//           + Android: build.gradle naverAppId
//
//   Apple:  npm install @invertase/react-native-apple-authentication
//           + iOS: Sign In with Apple capability in Xcode
//           (Android: Apple Sign In on Android uses web flow)
//
// Until the SDKs are installed, these functions throw with a clear message so
// developers know exactly what is missing rather than seeing a silent failure.

import type { NativeSocialAuthProvider } from './types'

export const nativeSocialAuthProvider: NativeSocialAuthProvider = {
  loginWithKakao: async () => {
    throw new Error(
      '[nativeSocialAuthProvider.loginWithKakao] Not implemented. ' +
        'Install @react-native-kakao/core + @react-native-kakao/user ' +
        'and replace this stub in src/lib/auth/social/native.ts.',
    )
  },

  loginWithNaver: async () => {
    throw new Error(
      '[nativeSocialAuthProvider.loginWithNaver] Not implemented. ' +
        'Install @react-native-seoul/naver-login ' +
        'and replace this stub in src/lib/auth/social/native.ts.',
    )
  },

  logoutKakao: async () => {
    // No-op until Kakao SDK is installed.
  },

  logoutNaver: async () => {
    // No-op until Naver SDK is installed.
  },
}
