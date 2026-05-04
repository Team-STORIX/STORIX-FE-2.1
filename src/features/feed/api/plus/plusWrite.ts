import { apiClient } from '../../../../lib/api/axios-instance'

export type CreateReviewBody = {
  worksId: number
  rating: string // "0.5" ~ "5.0"
  isSpoiler: boolean
  spoilerScript: string
  content: string
}

export type CreateBoardBody = {
  isWorksSelected: boolean
  worksId?: number
  isSpoiler: boolean
  spoilerScript: string
  content: string
  files?: { objectKey: string }[]
}

export async function createReaderReview(body: CreateReviewBody) {
  const { data } = await apiClient.post('/api/v1/plus/reader/review', body, {
    headers: { accept: '*/*' },
  })
  return data
}

export async function createReaderBoard(body: CreateBoardBody) {
  const payload: CreateBoardBody = { ...body }
  if (!payload.files || payload.files.length === 0) delete payload.files
  const { data } = await apiClient.post('/api/v1/plus/reader/board', payload, {
    headers: { accept: '*/*' },
  })
  return data
}
