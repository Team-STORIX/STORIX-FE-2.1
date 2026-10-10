import type {
  AppleNativeTokens,
  KakaoNativeTokens,
  NativeSocialAuthProvider,
  NaverNativeTokens,
} from './types'

const unsupported = (provider: string): Error =>
  new Error(`[${provider}Login] Native social login is not available on web.`)

export const nativeSocialAuthProvider: NativeSocialAuthProvider = {
  loginWithKakao: async (): Promise<KakaoNativeTokens> => {
    throw unsupported('Kakao')
  },
  logoutKakao: async (): Promise<void> => {},
  loginWithNaver: async (): Promise<NaverNativeTokens> => {
    throw unsupported('Naver')
  },
  logoutNaver: async (): Promise<void> => {},
  loginWithApple: async (): Promise<AppleNativeTokens> => {
    throw unsupported('Apple')
  },
}
