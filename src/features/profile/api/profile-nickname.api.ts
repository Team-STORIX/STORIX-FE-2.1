import { apiClient } from '../../../lib/api/axios-instance'

export type ProfileNicknameValidResponse = {
  isSuccess: boolean
  code: string
  message: string
  result?: unknown
  timestamp: string
}

const parseAvailability = (result: unknown): boolean | null => {
  if (typeof result === 'boolean') return result
  if (result && typeof result === 'object') {
    const value = result as Record<string, unknown>
    if (typeof value.isAvailable === 'boolean') return value.isAvailable
    if (typeof value.available === 'boolean') return value.available
    if (typeof value.duplicated === 'boolean') return !value.duplicated
    if (typeof value.isDuplicated === 'boolean') return !value.isDuplicated
  }
  return null
}

export const checkProfileNicknameValid = async (nickname: string) => {
  const response = await apiClient.get<ProfileNicknameValidResponse>(
    '/api/v1/profile/reader/nickname/valid',
    {
      params: { nickname },
      validateStatus: () => true,
    },
  )

  return {
    httpStatus: response.status,
    raw: response.data,
    available: parseAvailability(response.data?.result),
  }
}
