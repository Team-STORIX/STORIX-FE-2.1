import { z } from 'zod'
import { apiClient } from '../../../lib/api/axios-instance'
import { ApiEnvelopeSchema } from './works.schema'
import {
  WorksMyReviewSchema,
  WorksReviewDetailSchema,
  type WorksReviewItem,
  type WorksReviewSlice,
} from './worksReview.schema'

// GET /api/v1/works/{worksId}/review/me
const WorksMyReviewResponseSchema = ApiEnvelopeSchema(WorksMyReviewSchema)

export const getWorksMyReview = async (worksId: number) => {
  const res = await apiClient.get(`/api/v1/works/${worksId}/review/me`)
  return WorksMyReviewResponseSchema.parse(res.data).result
}

// ---------------------------------------------------------------------------
// Review list helpers
//
// The backend returns items as { profile: {...}, review: {...} } and sometimes
// wraps the Slice in a double result envelope.  These helpers normalise every
// observed shape into a plain WorksReviewSlice without ever throwing, so the
// infinite query never enters error state due to a schema mismatch.
// ---------------------------------------------------------------------------

function normalizeReviewItem(raw: unknown): WorksReviewItem | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, any>

  // Nested { profile, review } shape — used by most board/review endpoints
  let flat: Record<string, any>
  if (obj.profile && obj.review) {
    flat = {
      reviewId:        obj.review.reviewId,
      userName:        obj.profile.nickName,
      content:         obj.review.content,
      isSpoiler:       obj.review.isSpoiler,
      spoilerScript:   obj.review.spoilerScript,
      rating:          obj.review.rating,
      likeCount:       obj.review.likeCount,
      userId:          obj.profile.userId,
      profileImageUrl: obj.profile.profileImageUrl ?? null,
    }
  } else {
    flat = obj
  }

  const reviewId = flat.reviewId != null ? Number(flat.reviewId) : NaN
  if (!Number.isFinite(reviewId)) return null

  return {
    reviewId,
    userName:        flat.userName      != null ? String(flat.userName)      : undefined,
    content:         flat.content       != null ? String(flat.content)       : undefined,
    isSpoiler:       flat.isSpoiler === true,
    spoilerScript:   flat.spoilerScript != null ? String(flat.spoilerScript) : undefined,
    rating:          flat.rating        != null ? Number(flat.rating)        : null,
    likeCount:       flat.likeCount     != null ? Number(flat.likeCount)     : null,
    userId:          flat.userId        != null ? Number(flat.userId)        : undefined,
    profileImageUrl: flat.profileImageUrl ?? null,
  }
}

function normalizeReviewSlice(rawData: unknown): WorksReviewSlice {
  // TODO: remove this log once the response shape is confirmed stable
  if (__DEV__) {
    console.log(
      '[worksReview] raw response (first 800 chars):',
      JSON.stringify(rawData).slice(0, 800),
    )
  }

  if (!rawData || typeof rawData !== 'object') return { content: [] }
  const data = rawData as Record<string, any>

  // Unwrap one or two levels of { result: ... } envelope
  let slice: any = 'result' in data ? data.result : data
  if (slice && typeof slice === 'object' && 'result' in slice) {
    slice = slice.result
  }

  const rawItems: unknown[] = Array.isArray(slice?.content) ? slice.content : []
  const content = rawItems
    .map(normalizeReviewItem)
    .filter((item): item is WorksReviewItem => item !== null)

  const pageSize: number = typeof slice?.size === 'number' ? slice.size : 20

  return {
    content,
    number:           typeof slice?.number           === 'number'  ? slice.number           : undefined,
    size:             typeof slice?.size             === 'number'  ? slice.size             : undefined,
    numberOfElements: typeof slice?.numberOfElements === 'number'  ? slice.numberOfElements : undefined,
    last:             typeof slice?.last             === 'boolean' ? slice.last             : content.length < pageSize,
    empty:            typeof slice?.empty            === 'boolean' ? slice.empty            : content.length === 0,
    first:            typeof slice?.first            === 'boolean' ? slice.first            : undefined,
  }
}

// GET /api/v1/works/{worksId}/review?page=
export const getWorksReviews = async (params: {
  worksId: number
  page?: number
}): Promise<WorksReviewSlice> => {
  const { worksId, page = 0 } = params
  const res = await apiClient.get(`/api/v1/works/${worksId}/review`, {
    params: { page },
  })
  return normalizeReviewSlice(res.data)
}

// GET /api/v1/works/review/{reviewId}
const WorksReviewDetailResponseSchema = ApiEnvelopeSchema(WorksReviewDetailSchema)

export const getWorksReviewDetail = async (reviewId: number) => {
  const res = await apiClient.get(`/api/v1/works/review/${reviewId}`)
  return WorksReviewDetailResponseSchema.parse(res.data).result
}

// POST /api/v1/works/review/{reviewId}/like
export const postWorksReviewLike = async (reviewId: number) => {
  const res = await apiClient.post(`/api/v1/works/review/${reviewId}/like`)
  return ApiEnvelopeSchema(z.any()).parse(res.data).result
}

// POST /api/v1/works/review/{reviewId}/report
export const postWorksReviewReport = async (params: {
  reviewId: number
  payload?: unknown
}) => {
  const res = await apiClient.post(
    `/api/v1/works/review/${params.reviewId}/report`,
    params.payload ?? {},
  )
  return ApiEnvelopeSchema(z.any()).parse(res.data).result
}

const UpdateMyReviewPayloadSchema = z.object({
  rating: z.string(),
  isSpoiler: z.boolean(),
  spoilerScript: z.string(),
  content: z.string(),
})
export type UpdateMyReviewPayload = z.infer<typeof UpdateMyReviewPayloadSchema>

// PATCH /api/v1/works/review/{reviewId}
export const postUpdateMyReview = async (params: {
  reviewId: number
  payload: UpdateMyReviewPayload
}) => {
  const res = await apiClient.patch(
    `/api/v1/works/review/${params.reviewId}`,
    UpdateMyReviewPayloadSchema.parse(params.payload),
  )
  return ApiEnvelopeSchema(z.any()).parse(res.data).result
}

// DELETE /api/v1/works/review/{reviewId}
export const deleteMyReview = async (reviewId: number) => {
  const res = await apiClient.delete(`/api/v1/works/review/${reviewId}`)
  return ApiEnvelopeSchema(z.any()).parse(res.data).result
}
