import { apiClient } from '../../../lib/api/axios-instance'

export type ProfileActivitySort = 'LATEST'

export type ProfileActivityPageResult<T> = {
  numberOfElements: number
  size: number
  content: T[]
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export type ProfileActivityProfile = {
  userId: number
  profileImageUrl: string | null
  nickName: string
}

export type ProfileActivityImage = {
  boardId: number
  imageUrl: string
  sortOrder: number
}

export type ProfileActivityWorks = {
  worksId: number
  thumbnailUrl: string
  worksName: string
  artistName: string
  worksType: string
  genre: string
  hashtags: string[]
}

export type ProfileActivityBoard = {
  userId: number
  boardId: number
  isWorksSelected: boolean
  worksId: number | null
  lastCreatedTime: string
  content: string
  likeCount: number
  isSpoiler?: boolean
  replyCount: number
  isLiked: boolean
}

export type ProfileActivityBoardItem = {
  profile: ProfileActivityProfile
  board: ProfileActivityBoard
  images: ProfileActivityImage[]
  works: ProfileActivityWorks | null
  isSpoiler?: boolean
}

export type ProfileActivityReplyItem = {
  profile: ProfileActivityProfile
  reply: {
    replyId: number
    userId: number
    boardId: number
    comment: string
    lastCreatedTime: string
    likeCount: number
    isLiked: boolean
  }
}

export async function getProfileActivityBoards(params?: {
  page?: number
  sort?: ProfileActivitySort
}) {
  const { page = 0, sort = 'LATEST' } = params ?? {}
  const { data } = await apiClient.get<
    ApiEnvelope<ProfileActivityPageResult<ProfileActivityBoardItem>>
  >('/api/v1/profile/reader/activity/board', {
    params: { page, sort },
  })

  return data.result
}

export async function getProfileActivityLikes(params?: {
  page?: number
  sort?: ProfileActivitySort
}) {
  const { page = 0, sort = 'LATEST' } = params ?? {}
  const { data } = await apiClient.get<
    ApiEnvelope<ProfileActivityPageResult<ProfileActivityBoardItem>>
  >('/api/v1/profile/reader/activity/like', {
    params: { page, sort },
  })

  return data.result
}

export async function getProfileActivityReplies(params?: {
  page?: number
  sort?: ProfileActivitySort
}) {
  const { page = 0, sort = 'LATEST' } = params ?? {}
  const { data } = await apiClient.get<
    ApiEnvelope<ProfileActivityPageResult<ProfileActivityReplyItem>>
  >('/api/v1/profile/reader/activity/reply', {
    params: { page, sort },
  })

  return data.result
}
