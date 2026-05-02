import { apiClient } from '../axios-instance'
import {
  BoardImagePresignResponseSchema,
  PlusReviewDuplicateResponseSchema,
  PlusWorksSearchResponseSchema,
  ReaderBoardCreateResponseSchema,
  ReaderReviewCreateResponseSchema,
  type BoardImagePresignRequest,
  type ReaderBoardCreateRequest,
  type ReaderReviewCreateRequest,
} from './plus.schema'

/** POST /api/v1/plus/reader/review — 독자 리뷰 등록 */
export async function postReaderReview(payload: ReaderReviewCreateRequest) {
  const { data } = await apiClient.post('/api/v1/plus/reader/review', payload)
  return ReaderReviewCreateResponseSchema.parse(data)
}

/** POST /api/v1/plus/reader/board — 독자 게시글 등록 */
export async function postReaderBoard(payload: ReaderBoardCreateRequest) {
  const { data } = await apiClient.post('/api/v1/plus/reader/board', payload)
  return ReaderBoardCreateResponseSchema.parse(data)
}

/** POST /api/v1/image/board — 게시글 이미지 presigned url 발급 */
export async function postBoardImagePresignedUrls(
  payload: BoardImagePresignRequest,
) {
  const { data } = await apiClient.post('/api/v1/image/board', payload)
  return BoardImagePresignResponseSchema.parse(data)
}

/** GET /api/v1/plus/reader/works — [+] 작품 검색 */
export async function getPlusWorksSearch(params: {
  keyword: string
  page?: number
  size?: number
}) {
  const { keyword, page = 0, size = 20 } = params
  const { data } = await apiClient.get('/api/v1/plus/reader/works', {
    params: { keyword: keyword.trim(), page, size },
  })
  return PlusWorksSearchResponseSchema.parse(data)
}

/** GET /api/v1/plus/reader/review/{worksId} — 리뷰 중복 여부 조회 */
export async function getPlusReviewDuplicate(worksId: number) {
  const res = await apiClient.get(`/api/v1/plus/reader/review/${worksId}`, {
    validateStatus: (status) => status === 200 || status === 400,
  })
  return PlusReviewDuplicateResponseSchema.parse(res.data)
}

// NOTE: uploadToPresignedUrl from 2.0 used the browser File API.
// In RN, image uploads use expo-image-picker + FormData.
// Implement in a future phase when the write flow is built.
