import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Image } from 'react-native'

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
    // V2 fields with safe defaults
    topGenre: raw.topGenre ?? '',
    title: raw.title ?? null,
    stage: raw.stage ?? '미진입',
    nextStage: raw.nextStage ?? '입문',
    topGenreScore: raw.topGenreScore ?? 0,
    remainingScore: raw.remainingScore ?? 0,
    progressPercentage: raw.progressPercentage ?? 0,
  }
}

export const getMyProfile = async (): Promise<ApiResponse<MeProfileResult>> => {
  const res = await apiClient.get('/api/v2/profile/me')
  const data = res.data as ApiResponse<MeProfileResult>
  return data.result
    ? { ...data, result: normalizeMeProfile(data.result) }
    : data
}

export const updateProfileNickname = async (
  nickName: string,
): Promise<ApiResponse<string>> => {
  const res = await apiClient.post('/api/v1/profile/reader/nickname', { nickName }, {
    validateStatus: (status) => status >= 200 && status < 500,
  })
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

const PROFILE_MAX_SIZE = 512

const getImageSize = (uri: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    )
  })

const resizeProfileImage = async (localUri: string): Promise<string> => {
  const { width, height } = await getImageSize(localUri)
  const cropSize = Math.min(width, height)
  const context = ImageManipulator.manipulate(localUri)
  context.crop({
    originX: (width - cropSize) / 2,
    originY: (height - cropSize) / 2,
    width: cropSize,
    height: cropSize,
  })
  context.resize({ width: PROFILE_MAX_SIZE, height: PROFILE_MAX_SIZE })
  const image = await context.renderAsync()
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
  })
  return result.uri
}

export const uploadAndSetProfileImage = async (localUri: string): Promise<void> => {
  // Large originals can exceed the iOS notification service extension's
  // memory limit while decoding profile avatars. Keep profile uploads small,
  // but fall back to the original so a resize failure does not block updates.
  let uploadUri = localUri
  try {
    uploadUri = await resizeProfileImage(localUri)
  } catch {
    // Continue with the original image when local manipulation fails.
  }

  const contentType = 'image/jpeg'
  const { url, objectKey } = await getProfileImagePresignedUrl(contentType)
  const blob = await fetch(uploadUri).then((r) => r.blob())
  const uploadRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  })
  if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`)
  await updateProfileImage(objectKey)
}
