import { apiClient } from '../../../lib/api/axios-instance'
import {
  SignupResponseSchema,
  type SignupRequest,
  type SignupResponse,
} from './auth.schema'

/**
 * Completes signup for a new user.
 *
 * The onboarding token (obtained during social pre-login) is passed as a Bearer
 * token. The v2 signup endpoint is protected by the same auth filter, so custom
 * onboarding-only header names are ignored by the server.
 *
 * No withCredentials — tokens are managed via SecureStore, not cookies.
 */
export const signup = async (
  data: SignupRequest,
  onboardingToken: string,
): Promise<SignupResponse> => {
  if (__DEV__) {
    const trimmedToken = onboardingToken.trim()
    console.log('[signup] request body:', data)
    console.log('[signup] onboarding token present:', trimmedToken.length > 0)
    console.log('[signup] onboarding token shape:', {
      length: trimmedToken.length,
      hasBearerPrefix: trimmedToken.toLowerCase().startsWith('bearer '),
      jwtSegments: trimmedToken.split('.').length,
    })
  }

  const token = onboardingToken.trim().replace(/^Bearer\s+/i, '')

  const response = await apiClient.post(
    '/api/v2/auth/users/reader/signup',
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  return SignupResponseSchema.parse(response.data)
}
