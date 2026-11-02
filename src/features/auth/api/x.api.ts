import { apiClient } from '../../../lib/api/axios-instance'
import {
  SocialLoginResponseSchema,
  type SocialLoginResponse,
} from './auth.schema'

/**
 * X (Twitter) OAuth 2.0 PKCE login
 * Exchanges an authorization code + code_verifier for tokens via the backend.
 *
 * @param code - One-time authorization code (30s expiry)
 * @param redirectUri - Must match the redirect URI used in authorization request
 * @param codeVerifier - PKCE code verifier (generated with code_challenge)
 */
export const xLogin = async (args: {
  code: string
  redirectUri: string
  codeVerifier: string
}): Promise<SocialLoginResponse> => {
  console.log('[X Login API] request:', {
    hasCode: !!args.code,
    redirectUri: args.redirectUri,
    codeVerifierLength: args.codeVerifier.length,
  })

  const response = await apiClient.get('/api/v1/auth/oauth/x/login', {
    params: {
      code: args.code,
      redirectUri: args.redirectUri,
      codeVerifier: args.codeVerifier,
    },
  })

  console.log('[X Login API] response:', {
    status: response.status,
    code: response.data?.code,
    isSuccess: response.data?.isSuccess,
    isRegistered: response.data?.result?.isRegistered,
  })

  return SocialLoginResponseSchema.parse(response.data)
}
