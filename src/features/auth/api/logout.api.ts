import { apiClient } from '../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../lib/api/types'

/**
 * Signs the current user out server-side.
 * The access token is attached automatically by the request interceptor.
 * No withCredentials — the server invalidates the token by its value, not by cookie.
 */
export const logoutUser = async (): Promise<
  ApiResponse<Record<string, never>>
> => {
  const res = await apiClient.post('/api/v1/auth/user/logout', {})
  return res.data as ApiResponse<Record<string, never>>
}
