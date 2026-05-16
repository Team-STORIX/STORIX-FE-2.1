import { apiClient } from '../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../lib/api/types'

type ToggleWorkResult = { isFavoriteWorks: boolean }

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

// Named aliases kept for backward compat with existing callers.
export const addFavoriteWork = postFavoriteWork
export const removeFavoriteWork = deleteFavoriteWork
