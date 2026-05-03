import { apiClient } from '../../../lib/api/axios-instance'

export type DeveloperLoginResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: {
    accessToken: string
  }
  timestamp: string
}

/**
 * Developer-only login endpoint for testing purposes.
 * Not shown in production UI.
 */
export async function developerLogin(pendingId: string): Promise<DeveloperLoginResponse> {
  const res = await apiClient.post<DeveloperLoginResponse>(
    '/api/v1/auth/developer/login',
    { pendingId },
  )
  return res.data
}
