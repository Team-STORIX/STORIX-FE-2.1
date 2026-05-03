import { z } from 'zod'
import { apiClient } from '../../../lib/api/axios-instance'
import { ApiEnvelopeSchema } from './works.schema'
import {
  WorksMyReviewSchema,
  WorksReviewDetailSchema,
  WorksReviewSliceSchema,
} from './worksReview.schema'

// GET /api/v1/works/{worksId}/review/me
const WorksMyReviewResponseSchema = ApiEnvelopeSchema(WorksMyReviewSchema)

export const getWorksMyReview = async (worksId: number) => {
  const res = await apiClient.get(`/api/v1/works/${worksId}/review/me`)
  return WorksMyReviewResponseSchema.parse(res.data).result
}

// GET /api/v1/works/{worksId}/review?page=
// Some backend endpoints wrap the Slice inside a second result field:
//   { result: { result: { content: [...] } } }
// The preprocess normalises both single and double-nested shapes before parsing.
const WorksReviewsResponseSchema = z.preprocess((raw) => {
  if (raw && typeof raw === 'object') {
    const r = (raw as any).result
    if (r && typeof r === 'object' && 'result' in r) {
      return { ...(raw as any), result: r.result }
    }
  }
  return raw
}, ApiEnvelopeSchema(WorksReviewSliceSchema))

export const getWorksReviews = async (params: {
  worksId: number
  page?: number
}) => {
  const { worksId, page = 0 } = params
  const res = await apiClient.get(`/api/v1/works/${worksId}/review`, {
    params: { page },
  })
  return WorksReviewsResponseSchema.parse(res.data).result
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
