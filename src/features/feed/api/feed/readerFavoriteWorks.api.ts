import { apiClient } from '../../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../../lib/api/types'
import type { FeedSort, PageResult } from './readerBoard.api'

export type FavoriteWorkItem = {
  worksId: number
  thumbnailUrl: string
  worksName: string
  ageClassification?: 'ALL' | 'AGE_12' | 'AGE_15' | 'AGE_18'
  isAdultOnly?: boolean
  isBlinded?: boolean
}

// GET /api/v1/feed/reader/board/favorite/works
export const getFavoriteWorks = async (params?: {
  page?: number
  sort?: FeedSort
  size?: number
}) => {
  const { data } = await apiClient.get<ApiResponse<PageResult<FavoriteWorkItem>>>(
    '/api/v1/feed/reader/board/favorite/works',
    { params: { page: params?.page ?? 0, sort: params?.sort ?? 'LATEST', size: params?.size } },
  )
  return data.result
}
