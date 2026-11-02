import { apiClient } from '../../../lib/api/axios-instance'
import {
  AppVersionCheckResponseSchema,
  type AppVersionCheckParams,
  type AppVersionCheckResult,
} from './appVersion.schema'

/** GET /api/v1/app-version/check */
export async function checkAppVersion(
  params: AppVersionCheckParams,
): Promise<AppVersionCheckResult> {
  const res = await apiClient.get('/api/v1/app-version/check', {
    params,
    headers: { accept: '*/*' },
  })
  return AppVersionCheckResponseSchema.parse(res.data).result
}
