import { apiClient } from '../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../lib/api/types'

export type OnboardingWork = {
  worksId: number
  worksName: string
  thumbnailUrl: string
  artistName: string
}

/** GET /api/v1/onboarding/works — 관심 작품 선택 후보 */
export const getOnboardingWorks = async (): Promise<OnboardingWork[]> => {
  const response = await apiClient.get<ApiResponse<OnboardingWork[]>>('/api/v1/onboarding/works')
  return response.data.result ?? []
}
