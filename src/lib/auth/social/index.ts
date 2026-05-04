// src/lib/auth/social/index.ts
// webSocialAuthProvider is intentionally NOT exported here:
//   web.ts uses window.location redirects which are not valid in React Native.
//   Import it directly from './web' only if adding an expo-web-browser fallback.
export { isNativePlatform, getPlatform } from './platform'
export { nativeSocialAuthProvider } from './native'
export type {
  SocialProviderId,
  KakaoNativeTokens,
  NaverNativeTokens,
  NativeSocialAuthProvider,
  WebSocialAuthProvider,
} from './types'
