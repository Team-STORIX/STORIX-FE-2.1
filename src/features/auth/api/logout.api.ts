import { apiClient } from '../../../lib/api/axios-instance'
import { getOrCreateInstallationId } from '../../notification/services/deviceInstallation'
import type { ApiResponse } from '../../../lib/api/types'

export const logoutUser = async (): Promise<
  ApiResponse<Record<string, never>>
> => {
  const installationId = await getOrCreateInstallationId()
  const res = await apiClient.post('/api/v2/auth/user/logout', { installationId })
  return res.data as ApiResponse<Record<string, never>>
}
