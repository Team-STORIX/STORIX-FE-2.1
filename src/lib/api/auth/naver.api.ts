import { apiClient } from '../axios-instance'
import {
  SocialLoginResponseSchema,
  type SocialLoginResponse,
} from './auth.schema'

/**
 * Naver web login — exchanges an authorisation code + state for tokens via the backend.
 * Used when the OAuth redirect flow is handled by expo-web-browser or a web build.
 */
export const naverLogin = async (args: {
  code: string
  state: string
}): Promise<SocialLoginResponse> => {
  const response = await apiClient.get('/api/v1/auth/oauth/naver/login', {
    params: { code: args.code, state: args.state },
  })
  return SocialLoginResponseSchema.parse(response.data)
}

/**
 * Naver native login — iOS/Android SDK supplies the accessToken directly.
 */
export const naverNativeLogin = async (args: {
  accessToken: string
}): Promise<SocialLoginResponse> => {
  const response = await apiClient.post(
    '/api/v1/auth/oauth/naver-native/login',
    { accessToken: args.accessToken },
  )
  return SocialLoginResponseSchema.parse(response.data)
}
