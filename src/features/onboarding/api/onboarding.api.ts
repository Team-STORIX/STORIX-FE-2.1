import { apiClient } from '../../../lib/api/axios-instance'

export type OnboardingWork = {
  worksId: number
  worksName: string
  thumbnailUrl: string
  artistName: string
}

type ApiResponse<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export const getOnboardingWorks = async (): Promise<OnboardingWork[]> => {
  const response = await apiClient.get<ApiResponse<OnboardingWork[]>>(
    '/api/v1/onboarding/works',
  )

  return response.data.result ?? []
}
