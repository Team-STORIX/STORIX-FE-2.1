import { z } from 'zod'
import { apiClient } from '../axios-instance'
import {
  ApiEnvelopeSchema,
  LibraryRecentKeywordsSchema,
  LibraryReviewResultSchema,
  LibrarySearchWorkSchema,
  SliceSchema,
} from './library.schema'

export type LibraryReviewSort = 'LATEST' | 'DESC_RATING' | 'ASC_RATING'

// GET /api/v1/library/search/works?keyword=&page=
const LibrarySearchWorksResponseSchema = ApiEnvelopeSchema(
  SliceSchema(LibrarySearchWorkSchema),
)

export const getLibrarySearchWorks = async (params: {
  keyword: string
  page?: number
}) => {
  const { keyword, page = 0 } = params
  const res = await apiClient.get('/api/v1/library/search/works', {
    params: { keyword, page },
  })
  return LibrarySearchWorksResponseSchema.parse(res.data).result
}

// GET /api/v1/library/search/recent
const LibraryRecentResponseSchema = ApiEnvelopeSchema(LibraryRecentKeywordsSchema)

export const getLibraryRecentKeywords = async () => {
  const res = await apiClient.get('/api/v1/library/search/recent')
  return LibraryRecentResponseSchema.parse(res.data).result
}

// DELETE /api/v1/library/search/recent?keyword=
export const deleteLibraryRecentKeyword = async (params: {
  keyword: string
}) => {
  const res = await apiClient.delete('/api/v1/library/search/recent', { params })
  return ApiEnvelopeSchema(z.any()).parse(res.data).result
}

// GET /api/v1/library/review?sort=&page=
const LibraryReviewResponseSchema = ApiEnvelopeSchema(LibraryReviewResultSchema)

export const getLibraryReview = async (params: {
  sort?: LibraryReviewSort
  page?: number
}) => {
  const { sort = 'LATEST', page = 0 } = params
  const res = await apiClient.get('/api/v1/library/review', {
    params: { sort, page },
  })
  return LibraryReviewResponseSchema.parse(res.data).result
}
