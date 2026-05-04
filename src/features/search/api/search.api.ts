import { apiClient } from '../../../lib/api/axios-instance'
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

function normalizeList(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function serializeParams(params: {
  keyword: string
  sort: string
  page: number
  worksTypes: string[]
  genres: string[]
}) {
  const entries = [
    ['keyword', params.keyword],
    ['sort', params.sort],
    ['page', String(params.page)],
  ] as Array<[string, string]>

  for (const value of params.worksTypes) {
    entries.push(['worksTypes', value])
  }

  for (const value of params.genres) {
    entries.push(['genres', value])
  }

  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

export async function getWorksSearch(params: {
  keyword: string
  sort?: WorksSort
  page?: number
  worksTypes?: SearchWorksType[]
  genres?: SearchGenre[]
}) {
  const keyword = params.keyword.trim()
  const sort = params.sort ?? 'NAME'
  const page = params.page ?? 0
  const worksTypes = normalizeList(params.worksTypes ?? [])
  const genres = normalizeList(params.genres ?? [])

  const res = await apiClient.get('/api/v2/search/works', {
    params: { keyword, sort, page, worksTypes, genres },
    paramsSerializer: () =>
      serializeParams({ keyword, sort, page, worksTypes, genres }),
  })

  const raw = WorksSearchRawResponseSchema.parse(res.data)
  return WorksSearchResponseSchema.parse({
    ...raw,
    result: raw.result.result,
  })
}

export async function getTopicRoomSearch(params: {
  keyword: string
  sort?: TopicRoomSort
  page?: number
  worksTypes?: SearchWorksType[]
  genres?: SearchGenre[]
}) {
  const keyword = params.keyword.trim()
  const sort = params.sort ?? 'DEFAULT'
  const page = params.page ?? 0
  const worksTypes = normalizeList(params.worksTypes ?? [])
  const genres = normalizeList(params.genres ?? [])

  const res = await apiClient.get('/api/v2/search/topic-rooms', {
    params: { keyword, sort, page, worksTypes, genres },
    paramsSerializer: () =>
      serializeParams({ keyword, sort, page, worksTypes, genres }),
  })

  const raw = TopicRoomSearchRawResponseSchema.parse(res.data)
  return TopicRoomSearchResponseSchema.parse({
    ...raw,
    result: raw.result.result,
  })
}

export async function getTrendingKeywords() {
  const res = await apiClient.get('/api/v1/search/trending')
  return TrendingResponseSchema.parse(res.data)
}

export async function getRecentKeywords() {
  const res = await apiClient.get('/api/v1/search/recent')
  return RecentResponseSchema.parse(res.data)
}

export async function deleteRecentKeyword(keyword: string) {
  const res = await apiClient.delete('/api/v1/search/recent', {
    params: { keyword: keyword.trim() },
  })
  return DeleteRecentResponseSchema.parse(res.data)
}

export async function deleteAllRecentKeywords() {
  const res = await apiClient.delete('/api/v1/search/recent/all')
  return DeleteRecentResponseSchema.parse(res.data)
}
