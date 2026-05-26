import { apiClient } from '../../../lib/api/axios-instance'
import { WithdrawResponseSchema, type WithdrawResponse } from './auth.schema'

export const withdrawUser = async (reasons: string[], detail?: string): Promise<WithdrawResponse> => {
  const body: { reasons: string[]; detail?: string } = { reasons }
  if (detail) body.detail = detail

  const response = await apiClient.delete('/api/v2/auth/user/withdraw', { data: body })

  const parsed = WithdrawResponseSchema.safeParse(response.data)
  if (parsed.success) return parsed.data

  return response.data as WithdrawResponse
}
