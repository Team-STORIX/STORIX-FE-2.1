import axios from 'axios'
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
      role:            obj.profile.role,
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
    spoilerScript:   flat.spoilerScript != null ? String(flat.spoilerScript) : '',
    rating:          flat.rating        != null ? Number(flat.rating)        : null,
    likeCount:       flat.likeCount     != null ? Number(flat.likeCount)     : null,
    userId:          flat.userId        != null ? Number(flat.userId)        : undefined,
    profileImageUrl: flat.profileImageUrl ?? null,
    role:            flat.role          != null ? String(flat.role)          : undefined,
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
export type WorksReviewReportReason = 'ABUSE' | 'SPAM' | 'OTHER'

export type WorksReviewReportPayload = {
  reportedUserId: number
  reason: WorksReviewReportReason
  otherReason: string | null
}

// CustomResponse<Void>: the backend omits a null `result` from the JSON, so we
// parse against a result-agnostic schema and never read `.result`.
const WorksReviewReportResponseSchema = z.object({
  isSuccess: z.boolean(),
  code: z.string().optional(),
  message: z.string().optional(),
  result: z.unknown().nullish(),
  timestamp: z.string().optional(),
})

export const postWorksReviewReport = async (params: {
  reviewId: number
  payload: WorksReviewReportPayload
}): Promise<void> => {
  try {
    const res = await apiClient.post(
      `/api/v1/works/review/${params.reviewId}/report`,
      params.payload,
    )

    if (__DEV__) {
      // Log raw status/body (no headers, no auth tokens) before parsing.
      console.log('[worksReview][report] response', {
        status: res.status,
        data: res.data,
      })
    }

    const parsed = WorksReviewReportResponseSchema.parse(res.data)
    if (!parsed.isSuccess) {
      throw new Error(parsed.message ?? '신고 처리에 실패했어요.')
    }
  } catch (error) {
    if (__DEV__) {
      if (axios.isAxiosError(error)) {
        console.log('[worksReview][report] axios error', {
          status: error.response?.status,
          code: (error.response?.data as { code?: string } | undefined)?.code,
          message:
            (error.response?.data as { message?: string } | undefined)?.message,
        })
      } else if (error instanceof z.ZodError) {
        console.log('[worksReview][report] parse error', error.issues)
      } else {
        console.log('[worksReview][report] error', {
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }
    throw error
  }
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
// Also CustomResponse<Void>: parse result-agnostically and don't read `.result`.
export const deleteMyReview = async (reviewId: number): Promise<void> => {
  const res = await apiClient.delete(`/api/v1/works/review/${reviewId}`)
  const parsed = WorksReviewReportResponseSchema.parse(res.data)
  if (!parsed.isSuccess) {
    throw new Error(parsed.message ?? '리뷰 삭제에 실패했어요.')
  }
}
