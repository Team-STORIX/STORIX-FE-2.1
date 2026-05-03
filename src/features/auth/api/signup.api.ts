import { apiClient } from '../../../lib/api/axios-instance'
import {
  SignupResponseSchema,
  type SignupRequest,
  type SignupResponse,
} from './auth.schema'

/**
 * Completes signup for a new user.
 *
 * The onboarding token (obtained during social pre-login) is passed as a
 * Bearer token in the Authorization header. The apiClient request interceptor
 * will NOT overwrite an existing Authorization header, so passing it here is safe.
 *
 * No withCredentials — tokens are managed via SecureStore, not cookies.
 */
export const signup = async (
  data: SignupRequest,
  onboardingToken: string,
): Promise<SignupResponse> => {
  const response = await apiClient.post(
    '/api/v1/auth/users/reader/signup',
    data,
    {
      headers: {
        Authorization: `Bearer ${onboardingToken.trim()}`,
      },
    },
  )
  return SignupResponseSchema.parse(response.data)
}
