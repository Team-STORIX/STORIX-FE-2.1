import { apiClient } from '../../../../lib/api/axios-instance'
import type { FeedBoardItem, FeedSort, PageResult } from './readerBoard.api'

type ApiResponse<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export type ReplyItem = {
  profile: { userId: number; profileImageUrl: string | null; nickName: string }
  reply: {
    replyId: number
    userId: number
    comment: string
    lastCreatedTime: string
    likeCount: number
    isLiked: boolean
  }
}

export type BoardDetailResult = {
  board: FeedBoardItem
  comment: PageResult<ReplyItem>
}

// GET /api/v1/feed/reader/board/{boardId}
export const getBoardDetail = async (params: {
  boardId: number
  page: number
  sort?: FeedSort
}) => {
  const { data } = await apiClient.get<ApiResponse<BoardDetailResult>>(
    `/api/v1/feed/reader/board/${params.boardId}`,
    { params: { sort: params.sort ?? 'LATEST', page: params.page } },
  )
  return data.result
}

// POST /api/v1/feed/reader/board/{boardId}/reply/{replyId}/like
export const toggleReplyLike = async (params: {
  boardId: number
  replyId: number
}) => {
  const { data } = await apiClient.post<
    ApiResponse<{ isLiked: boolean; likeCount: number }>
  >(`/api/v1/feed/reader/board/${params.boardId}/reply/${params.replyId}/like`)
  return data.result
}

// POST /api/v1/feed/reader/board/{boardId}/reply
export const createReply = async (params: { boardId: number; comment: string }) => {
  const { data } = await apiClient.post(
    `/api/v1/feed/reader/board/${params.boardId}/reply`,
    { comment: params.comment },
  )
  return data.result
}

// POST /api/v1/feed/reader/board/{boardId}/reply/{replyId}/reply
export const createSubReply = async (params: {
  boardId: number
  replyId: number
  comment: string
}) => {
  const { data } = await apiClient.post(
    `/api/v1/feed/reader/board/${params.boardId}/reply/${params.replyId}/reply`,
    { comment: params.comment },
  )
  return data.result
}

// DELETE /api/v1/feed/reader/board/{boardId}/reply/{replyId}
export const deleteReply = async (params: { boardId: number; replyId: number }) => {
  const { data } = await apiClient.delete(
    `/api/v1/feed/reader/board/${params.boardId}/reply/${params.replyId}`,
  )
  return data.result
}
