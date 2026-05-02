import { apiClient } from '../../../../lib/api/axios-instance'
import type { FeedSort } from './readerBoard.api'

export type FavoriteWorkItem = {
  worksId: number
  thumbnailUrl: string
  worksName: string
}

export type FavoriteWorksResult = {
  content: FavoriteWorkItem[]
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

type FavoriteWorksResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: FavoriteWorksResult
  timestamp: string
}

// GET /api/v1/feed/reader/board/favorite/works
export const getFavoriteWorks = async (params?: {
  page?: number
  sort?: FeedSort
}) => {
  const res = await apiClient.get<FavoriteWorksResponse>(
    '/api/v1/feed/reader/board/favorite/works',
    { params: { page: params?.page ?? 0, sort: params?.sort ?? 'LATEST' } },
  )
  return res.data
}
