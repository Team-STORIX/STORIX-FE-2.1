import { apiClient } from '../../../lib/api/axios-instance'
import { getRefreshToken } from '../../../lib/storage/secure'
import { getOrCreateInstallationId } from '../../notification/services/deviceInstallation'
import type { ApiResponse } from '../../../lib/api/types'

export const logoutUser = async (): Promise<
  ApiResponse<Record<string, never>>
> => {
  const [installationId, refreshToken] = await Promise.all([
    getOrCreateInstallationId(),
    getRefreshToken(),
  ])
  const res = await apiClient.post('/api/v2/auth/user/logout', {
    installationId,
    refreshToken: refreshToken ?? '',
  })
  return res.data as ApiResponse<Record<string, never>>
}
