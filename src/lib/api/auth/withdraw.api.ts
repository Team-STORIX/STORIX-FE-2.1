import { apiClient } from '../axios-instance'
import { WithdrawResponseSchema, type WithdrawResponse } from './auth.schema'

/**
 * Permanently withdraws the current user's account.
 * DELETE /api/v1/auth/user/withdraw
 *
 * safeParse is used because the response shape may deviate from the Swagger spec
 * on edge cases; a 2xx status is treated as a successful withdrawal regardless.
 */
export const withdrawUser = async (): Promise<WithdrawResponse> => {
  const response = await apiClient.delete('/api/v1/auth/user/withdraw')

  const parsed = WithdrawResponseSchema.safeParse(response.data)
  if (parsed.success) return parsed.data

  return response.data as WithdrawResponse
}
