import { apiClient } from '../axios-instance'
import {
  SocialLoginResponseSchema,
  type SocialLoginResponse,
} from './auth.schema'

/**
 * Apple login — exchanges an authorisation code for tokens via the backend.
 * Works with both the web redirect flow and the native @invertase/react-native-apple-authentication.
 */
export const appleLogin = async (code: string): Promise<SocialLoginResponse> => {
  const response = await apiClient.get('/api/v1/auth/oauth/apple/login', {
    params: { code },
  })
  return SocialLoginResponseSchema.parse(response.data)
}
