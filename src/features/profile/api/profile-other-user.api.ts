import { apiClient } from '../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../lib/api/types'
import type { OtherUserProfileResult } from '../../../types/profile'
import type { LibraryReviewSort } from '../../library/api/library.api'
import type {
  HashtagRankingResponse,
  OtherUserFavoriteWorksResponse,
  OtherUserLibraryResponse,
  RatingCountsMap,
  SortLatest,
} from '../types'
import { normalizeProfile, type GenreStatItem } from './profile.api'

// Every endpoint here rejects the caller's own id; use the /profile/me family for that.
const basePath = (userId: number) => `/api/v1/profile/other-users/${userId}`

// GET /api/v1/profile/other-users/{userId}
export const getOtherUserProfile = async (userId: number): Promise<OtherUserProfileResult> => {
  const { data } = await apiClient.get<ApiResponse<OtherUserProfileResult>>(basePath(userId))
  return normalizeProfile(data.result)
}

// GET /api/v1/profile/other-users/{userId}/stats
export const getOtherUserGenreStats = async (userId: number): Promise<GenreStatItem[]> => {
  const { data } = await apiClient.get<ApiResponse<GenreStatItem[]>>(`${basePath(userId)}/stats`)
  return data.result ?? []
}

// GET /api/v1/profile/other-users/{userId}/ratings
export const getOtherUserRatings = async (userId: number): Promise<RatingCountsMap> => {
  const { data } = await apiClient.get<ApiResponse<{ ratingCounts: RatingCountsMap }>>(
    `${basePath(userId)}/ratings`,
  )
  return data.result?.ratingCounts ?? {}
}

// GET /api/v1/profile/other-users/{userId}/hashtags
export const getOtherUserHashtags = async (userId: number): Promise<Record<number, string>> => {
  const { data } = await apiClient.get<ApiResponse<HashtagRankingResponse>>(
    `${basePath(userId)}/hashtags`,
  )
  return data.result?.rankings ?? {}
}

// GET /api/v1/profile/other-users/{userId}/library?sort=&page=
export const getOtherUserLibrary = async (params: {
  userId: number
  sort?: LibraryReviewSort
  page?: number
}): Promise<OtherUserLibraryResponse> => {
  const { data } = await apiClient.get<ApiResponse<OtherUserLibraryResponse>>(
    `${basePath(params.userId)}/library`,
    { params: { sort: params.sort ?? 'LATEST', page: params.page ?? 0 } },
  )
  return data.result
}

// GET /api/v1/profile/other-users/{userId}/favorite/works?sort=&page=
// Adult works come masked according to the viewer's own verification.
export const getOtherUserFavoriteWorks = async (params: {
  userId: number
  sort?: SortLatest
  page?: number
}): Promise<OtherUserFavoriteWorksResponse> => {
  const { data } = await apiClient.get<ApiResponse<OtherUserFavoriteWorksResponse>>(
    `${basePath(params.userId)}/favorite/works`,
    { params: { sort: params.sort ?? 'LATEST', page: params.page ?? 0 } },
  )
  return data.result
}
