import { apiClient } from '../axios-instance'
import type { ApiResponse } from '../types'
import type { MeProfileResult } from '../../../types/profile'

export const getMyProfile = async (): Promise<ApiResponse<MeProfileResult>> => {
  const res = await apiClient.get('/api/v1/profile/me')
  return res.data as ApiResponse<MeProfileResult>
}

export const updateProfileNickname = async (
  nickName: string,
): Promise<ApiResponse<string>> => {
  const res = await apiClient.post('/api/v1/profile/reader/nickname', { nickName })
  return res.data as ApiResponse<string>
}

export const updateProfileDescription = async (
  profileDescription: string,
): Promise<ApiResponse<string>> => {
  const res = await apiClient.post('/api/v1/profile/description', { profileDescription })
  return res.data as ApiResponse<string>
}

export const updateProfileImage = async (
  objectKey: string,
): Promise<ApiResponse<string>> => {
  const res = await apiClient.post('/api/v1/profile/image', { objectKey })
  return res.data as ApiResponse<string>
}
