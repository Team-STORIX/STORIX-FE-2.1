import { apiClient } from '../../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../../lib/api/types'
import type { FeedBoardItem, PageResult } from './readerBoard.api'

// GET /api/v1/feed/reader/board/search?keyword=&page=
// Searching the first page also saves the keyword to the feed recent keywords.
export const searchBoards = async (params: { keyword: string; page: number }) => {
  const { data } = await apiClient.get<ApiResponse<PageResult<FeedBoardItem>>>(
    '/api/v1/feed/reader/board/search',
    { params: { keyword: params.keyword, page: params.page } },
  )
  return data.result
}

// GET /api/v1/feed/search/recent
export const getFeedRecentKeywords = async () => {
  const { data } = await apiClient.get<ApiResponse<{ recentKeywords: string[] }>>(
    '/api/v1/feed/search/recent',
  )
  return { recentKeywords: data.result?.recentKeywords ?? [] }
}

// DELETE /api/v1/feed/search/recent?keyword=
export const deleteFeedRecentKeyword = async (keyword: string) => {
  const res = await apiClient.delete('/api/v1/feed/search/recent', {
    params: { keyword: keyword.trim() },
  })
  return res.data
}

// DELETE /api/v1/feed/search/recent/all
export const deleteAllFeedRecentKeywords = async () => {
  const res = await apiClient.delete('/api/v1/feed/search/recent/all')
  return res.data
}
