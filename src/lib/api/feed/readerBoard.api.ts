import axios from 'axios'
import { apiClient } from '../axios-instance'

export type FeedSort = 'LATEST'

export type FeedBoardImage = { boardId: number; imageUrl: string; sortOrder: number }

export type FeedWorks = {
  worksId: number
  thumbnailUrl: string
  worksName: string
  artistName: string
  worksType: string
  genre: string
  hashtags: string[]
}

export type FeedBoardItem = {
  profile: { userId: number; profileImageUrl: string | null; nickName: string }
  board: {
    userId: number
    boardId: number
    isWorksSelected: boolean
    worksId?: number
    lastCreatedTime: string
    content: string
    likeCount: number
    replyCount: number
    isSpoiler?: boolean
    isLiked: boolean
  }
  images: FeedBoardImage[]
  works: FeedWorks | null
}

export type PageResult<T> = {
  numberOfElements: number
  size: number
  content: T[]
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export type ApiResponse<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

// GET /api/v1/feed/reader/board
export const getAllBoards = async (params: { page: number; sort?: FeedSort }) => {
  const { data } = await apiClient.get<ApiResponse<PageResult<FeedBoardItem>>>(
    '/api/v1/feed/reader/board',
    { params: { sort: params.sort ?? 'LATEST', page: params.page } },
  )
  return data.result
}

// GET /api/v1/feed/reader/board/works/{worksId}
export const getBoardsByWorksId = async (params: {
  worksId: number
  page: number
  sort?: FeedSort
}) => {
  const { data } = await apiClient.get<ApiResponse<PageResult<FeedBoardItem>>>(
    `/api/v1/feed/reader/board/works/${params.worksId}`,
    { params: { sort: params.sort ?? 'LATEST', page: params.page } },
  )
  return data.result
}

// POST /api/v1/feed/reader/board/{boardId}/like
export const toggleBoardLike = async (boardId: number) => {
  const { data } = await apiClient.post<
    ApiResponse<{ isLiked: boolean; likeCount: number }>
  >(`/api/v1/feed/reader/board/${boardId}/like`)
  return data.result
}

// DELETE /api/v1/feed/reader/board/{boardId}
export const deleteBoard = async (boardId: number) => {
  const res = await apiClient.delete(`/api/v1/feed/reader/board/${boardId}`)
  return res.data
}

export type ReportBoardResult =
  | { status: 'ok' }
  | { status: 'duplicated'; message: string }

// POST /api/v1/feed/reader/board/{boardId}/report
// 400 (duplicate report) is absorbed and returned as { status: 'duplicated' }
export const reportBoard = async (params: {
  boardId: number
  reportedUserId: number
}): Promise<ReportBoardResult> => {
  try {
    await apiClient.post(`/api/v1/feed/reader/board/${params.boardId}/report`, {
      reportedUserId: params.reportedUserId,
    })
    return { status: 'ok' }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 400) {
      const body = err.response.data as any
      const msg =
        typeof body?.message === 'string' && body.message.trim()
          ? body.message
          : '이미 신고한 글이에요.'
      return { status: 'duplicated', message: msg }
    }
    throw err
  }
}
