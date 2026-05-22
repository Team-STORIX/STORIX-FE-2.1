import { apiClient } from '../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../lib/api/types'
import type { MeProfileResult } from '../../../types/profile'

export type GenreStatItem = {
  genre: string
  score: number
}

export const getGenreStats = async (): Promise<ApiResponse<GenreStatItem[]>> => {
  const res = await apiClient.get('/api/v1/profile/reader/stats')
  return res.data as ApiResponse<GenreStatItem[]>
}

// Fallback nickname for users whose profile has not been filled in yet
// (e.g. developer-login accounts), so the UI never renders an empty name.
export const DEFAULT_NICKNAME = '스토릭스 유저'

// The backend can return null for nickName / profileDescription / profileImageUrl
// on incomplete profiles, but MeProfileResult types the text fields as non-null
// strings. Normalize once here at the API boundary so every consumer (store + all
// profile UI) receives safe values and no component calls .trim() on null.
const normalizeMeProfile = (raw: MeProfileResult): MeProfileResult => {
  const nickName = (raw.nickName ?? '').trim()
  return {
    ...raw,
    nickName: nickName.length > 0 ? nickName : DEFAULT_NICKNAME,
    profileDescription: raw.profileDescription ?? '',
    profileImageUrl: raw.profileImageUrl ?? null,
  }
}

export const getMyProfile = async (): Promise<ApiResponse<MeProfileResult>> => {
  const res = await apiClient.get('/api/v1/profile/me')
  const data = res.data as ApiResponse<MeProfileResult>
  return data.result
    ? { ...data, result: normalizeMeProfile(data.result) }
    : data
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

export const getProfileImagePresignedUrl = async (
  contentType: string,
): Promise<{ url: string; objectKey: string; expiresInSeconds: number }> => {
  const res = await apiClient.post('/api/v1/image/profile', {
    file: { contentType },
  })
  return res.data.result
}

export const uploadAndSetProfileImage = async (localUri: string): Promise<void> => {
  const contentType = /\.png$/i.test(localUri) ? 'image/png' : 'image/jpeg'
  const { url, objectKey } = await getProfileImagePresignedUrl(contentType)
  const blob = await fetch(localUri).then((r) => r.blob())
  const uploadRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  })
  if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`)
  await updateProfileImage(objectKey)
}
