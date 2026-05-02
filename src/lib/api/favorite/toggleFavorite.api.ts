import { apiClient } from '../axios-instance'
import type { ApiResponse } from '../types'

type ToggleWorkResult = { isFavoriteWorks: boolean }
type ToggleArtistResult = { isFavoriteArtist: boolean }

export async function postFavoriteWork(worksId: number) {
  const { data } = await apiClient.post<ApiResponse<ToggleWorkResult>>(
    `/api/v1/favorite/works/${worksId}`,
  )
  return data.result
}

export async function deleteFavoriteWork(worksId: number) {
  const { data } = await apiClient.delete<ApiResponse<ToggleWorkResult>>(
    `/api/v1/favorite/works/${worksId}`,
  )
  return data.result
}

export async function postFavoriteArtist(artistId: number) {
  const { data } = await apiClient.post<ApiResponse<ToggleArtistResult>>(
    `/api/v1/favorite/artist/${artistId}`,
  )
  return data.result
}

export async function deleteFavoriteArtist(artistId: number) {
  const { data } = await apiClient.delete<ApiResponse<ToggleArtistResult>>(
    `/api/v1/favorite/artist/${artistId}`,
  )
  return data.result
}

// Named aliases kept for backward compat with existing callers.
export const addFavoriteWork = postFavoriteWork
export const removeFavoriteWork = deleteFavoriteWork
export const addFavoriteArtist = postFavoriteArtist
export const removeFavoriteArtist = deleteFavoriteArtist
