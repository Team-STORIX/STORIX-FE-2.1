import { apiClient } from '../../../lib/api/axios-instance'
import type {
  ApiEnvelope,
  FavoriteWorksResponse,
  HashtagRankingResponse,
  ReaderRatingsResponse,
  SortLatest,
} from '../types'

export async function getReaderFavoriteWorks(params: {
  page?: number
  sort?: SortLatest
}): Promise<FavoriteWorksResponse> {
  const { data } = await apiClient.get<ApiEnvelope<FavoriteWorksResponse>>(
    '/api/v1/profile/reader/favorite/works',
    {
      params: {
        sort: params.sort ?? 'LATEST',
        page: params.page ?? 0,
      },
    },
  )

  return data.result
}


export async function getReaderRatings(): Promise<ReaderRatingsResponse> {
  const res = await apiClient.get<ReaderRatingsResponse>(
    '/api/v1/profile/reader/ratings',
  )

  return res.data
}

export async function getPreferredHashtags(): Promise<Record<number, string>> {
  const res = await apiClient.get<{
    isSuccess: boolean
    result: HashtagRankingResponse
  }>('/api/v1/profile/reader/hashtags')

  return res.data.result.rankings
}
