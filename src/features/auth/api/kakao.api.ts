import { apiClient } from '../../../lib/api/axios-instance'
import {
  KakaoLoginResponseSchema,
  SocialLoginResponseSchema,
  type KakaoLoginResponse,
  type SocialLoginResponse,
} from './auth.schema'

/**
 * Builds the Kakao OAuth authorisation URL.
 * Used by the expo-web-browser redirect flow (dev/web builds only).
 * Not needed when using the native Kakao SDK on iOS/Android.
 */
export const getKakaoAuthUrl = (): string => {
  const clientId = process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID
  const redirectUri = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI
  if (!clientId || !redirectUri) {
    throw new Error(
      'Kakao OAuth env (EXPO_PUBLIC_KAKAO_CLIENT_ID / EXPO_PUBLIC_KAKAO_REDIRECT_URI) is missing',
    )
  }
  return (
    `https://kauth.kakao.com/oauth/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&prompt=select_account`
  )
}

/**
 * Kakao web login — exchanges an authorisation code for tokens via the backend.
 * Used when the OAuth redirect flow is handled by expo-web-browser or a web build.
 */
export const kakaoLogin = async (code: string): Promise<KakaoLoginResponse> => {
  const redirectUri = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI
  const response = await apiClient.get('/api/v1/auth/oauth/kakao/login', {
    params: { code, redirectUri },
  })
  return KakaoLoginResponseSchema.parse(response.data)
}

/**
 * Kakao native login — iOS/Android SDK supplies accessToken and optionally idToken.
 *
 * idToken is optional: the Kakao SDK only includes it when "OpenID Connect" is
 * enabled in the Kakao developer console. The backend must accept a missing idToken
 * gracefully (confirm with BE if your console has it disabled).
 */
export const kakaoNativeLogin = async (args: {
  accessToken: string
  idToken: string
}): Promise<SocialLoginResponse> => {
  const response = await apiClient.post(
    '/api/v1/auth/oauth/kakao-native/login',
    {
      accessToken: args.accessToken,
      idToken: args.idToken,
    },
  )
  return SocialLoginResponseSchema.parse(response.data)
}
