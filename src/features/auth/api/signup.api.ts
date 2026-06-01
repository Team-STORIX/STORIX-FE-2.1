import { apiClient } from '../../../lib/api/axios-instance'
import { isAxiosError } from 'axios'
import {
  SignupResponseSchema,
  type SignupRequest,
  type SignupResponse,
} from './auth.schema'

/**
 * Completes signup for a new user.
 *
 * The onboarding token (obtained during social pre-login) is passed in the
 * header. The current backend contract is the deprecated v1 endpoint, which
 * expects marketingAgree instead of the v2 termsAgree field.
 *
 * No withCredentials — tokens are managed via SecureStore, not cookies.
 */
export const signup = async (
  data: SignupRequest,
  onboardingToken: string,
): Promise<SignupResponse> => {
  const token = onboardingToken.trim().replace(/^Bearer\s+/i, '')

  if (__DEV__) {
    console.log('[signup] request body:', data)
    console.log('[signup] onboarding token present:', token.length > 0)
    console.log('[signup] onboarding token shape:', {
      length: token.length,
      hasBearerPrefix: onboardingToken.trim().toLowerCase().startsWith('bearer '),
      jwtSegments: token.split('.').length,
    })
  }

  const headerAttempts = [
    { label: 'Authorization Bearer', headers: { Authorization: `Bearer ${token}` } },
    { label: 'Authorization raw', headers: { Authorization: token } },
    { label: 'Onboarding-Token', headers: { 'Onboarding-Token': token } },
    { label: 'onboardingToken', headers: { onboardingToken: token } },
  ] as const

  let lastError: unknown

  for (const attempt of headerAttempts) {
    try {
      if (__DEV__) {
        console.log('[signup] header attempt:', attempt.label)
      }

      const response = await apiClient.post(
        '/api/v1/auth/users/reader/signup',
        data,
        { headers: attempt.headers },
      )
      return SignupResponseSchema.parse(response.data)
    } catch (error) {
      lastError = error
      if (!isAxiosError(error) || error.response?.status !== 401) {
        throw error
      }

      if (__DEV__) {
        console.log('[signup] header attempt failed:', {
          label: attempt.label,
          status: error.response.status,
          code: (error.response.data as any)?.code,
          message: (error.response.data as any)?.message,
        })
      }
    }
  }

  throw lastError
}
