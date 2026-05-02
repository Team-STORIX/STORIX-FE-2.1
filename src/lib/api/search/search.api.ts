import { apiClient } from '../axios-instance'
import {
  DeleteRecentResponseSchema,
  RecentResponseSchema,
  TopicRoomSearchRawResponseSchema,
  TopicRoomSearchResponseSchema,
  TrendingResponseSchema,
  WorksSearchRawResponseSchema,
  WorksSearchResponseSchema,
  type SearchGenre,
  type SearchWorksType,
  type TopicRoomSort,
  type WorksSort,
} from './search.schema'

type GetWorksSearchParams = {
  keyword: string
  sort?: WorksSort
  page?: number
  worksTypes?: SearchWorksType[]
  genres?: SearchGenre[]
}

/**
 * GET /api/v2/search/works
 * Normalises the double-nested result (result.result.content → result.content)
 * before returning so consumers always read data.result.content.
 */
export const getWorksSearch = async (params: GetWorksSearchParams) => {
  const {
    keyword,
    sort = 'NAME',
    page = 0,
    worksTypes = [],
    genres = [],
  } = params
  const k = keyword.trim()
  const uniqueTypes = Array.from(new Set(worksTypes))
  const uniqueGenres = Array.from(new Set(genres))

  const res = await apiClient.get('/api/v2/search/works', {
    params: { keyword: k, sort, page, worksTypes: uniqueTypes, genres: uniqueGenres },
    paramsSerializer: (p) => {
      const sp = new URLSearchParams()
      sp.set('keyword', String(p.keyword ?? ''))
      sp.set('sort', String(p.sort ?? 'NAME'))
      sp.set('page', String(p.page ?? 0))
      uniqueTypes.forEach((v) => sp.append('worksTypes', v))
      uniqueGenres.forEach((v) => sp.append('genres', v))
      return sp.toString()
    },
  })

  // Server returns { result: { result: Slice, fallbackRecommendation } }
  // Flatten so consumers see { result: Slice, ... }
  const raw = WorksSearchRawResponseSchema.parse(res.data)
  const normalized = { ...raw, result: raw.result.result }
  return WorksSearchResponseSchema.parse(normalized)
}

type GetTopicRoomSearchParams = {
  keyword: string
  sort?: TopicRoomSort
  page?: number
  worksTypes?: SearchWorksType[]
  genres?: SearchGenre[]
}

/** GET /api/v2/search/topic-rooms */
export const getTopicRoomSearch = async (params: GetTopicRoomSearchParams) => {
  const {
    keyword,
    sort = 'DEFAULT',
    page = 0,
    worksTypes = [],
    genres = [],
  } = params
  const k = keyword.trim()
  const uniqueTypes = Array.from(new Set(worksTypes))
  const uniqueGenres = Array.from(new Set(genres))

  const res = await apiClient.get('/api/v2/search/topic-rooms', {
    params: { keyword: k, sort, page, worksTypes: uniqueTypes, genres: uniqueGenres },
    paramsSerializer: (p) => {
      const sp = new URLSearchParams()
      sp.set('keyword', String(p.keyword ?? ''))
      sp.set('sort', String(p.sort ?? 'DEFAULT'))
      sp.set('page', String(p.page ?? 0))
      uniqueTypes.forEach((v) => sp.append('worksTypes', v))
      uniqueGenres.forEach((v) => sp.append('genres', v))
      return sp.toString()
    },
  })

  const raw = TopicRoomSearchRawResponseSchema.parse(res.data)
  const normalized = { ...raw, result: raw.result.result }
  return TopicRoomSearchResponseSchema.parse(normalized)
}

/** GET /api/v1/search/trending */
export const getTrendingKeywords = async () => {
  const res = await apiClient.get('/api/v1/search/trending')
  return TrendingResponseSchema.parse(res.data)
}

/** GET /api/v1/search/recent */
export const getRecentKeywords = async () => {
  const res = await apiClient.get('/api/v1/search/recent')
  return RecentResponseSchema.parse(res.data)
}

/** DELETE /api/v1/search/recent?keyword= */
export const deleteRecentKeyword = async (keyword: string) => {
  const res = await apiClient.delete('/api/v1/search/recent', {
    params: { keyword: keyword.trim() },
  })
  return DeleteRecentResponseSchema.parse(res.data)
}

/** DELETE /api/v1/search/recent/all */
export const deleteAllRecentKeywords = async () => {
  const res = await apiClient.delete('/api/v1/search/recent/all')
  return DeleteRecentResponseSchema.parse(res.data)
}
