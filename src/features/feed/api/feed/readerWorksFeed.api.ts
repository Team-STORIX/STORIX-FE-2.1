import { apiClient } from '../../../../lib/api/axios-instance'
import type { FeedSort } from './readerBoard.api'

export type WorksFeedBoardItem = {
  profile: { userId: number; profileImageUrl: string | null; nickName: string }
  board: {
    userId: number
    boardId: number
    isWorksSelected: boolean
    worksId: number
    lastCreatedTime: string
    content: string
    likeCount: number
    replyCount: number
    isSpoiler: boolean
    isLiked: boolean
  }
  images?: { boardId: number; imageUrl: string; sortOrder: number }[]
  works?: {
    worksId: number
    thumbnailUrl: string
    worksName: string
    artistName: string
    worksType: string
    genre: string
    hashtags: string[]
  } | null
}

type PagedResult<T> = {
  content: T[]
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

type WorksFeedResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: PagedResult<WorksFeedBoardItem>
  timestamp: string
}

// GET /api/v1/feed/reader/board/works/{worksId}
export const getFeedBoardsByWorksId = async (args: {
  worksId: number
  page?: number
  sort?: FeedSort
}) => {
  const res = await apiClient.get<WorksFeedResponse>(
    `/api/v1/feed/reader/board/works/${args.worksId}`,
    { params: { page: args.page ?? 0, sort: args.sort ?? 'LATEST' } },
  )
  return res.data
}
