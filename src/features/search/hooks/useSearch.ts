import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAllRecentKeywords,
  deleteRecentKeyword,
  getRecentKeywords,
  getTopicRoomSearch,
  getTrendingKeywords,
  getWorksSearch,
} from '../api'
import type {
  SearchGenre,
  SearchWorksType,
  TopicRoomSearchItem,
  TopicRoomSort,
  WorksSearchItem,
  WorksSort,
} from '../api'

function normalizeKeyword(keyword: string) {
  return keyword.replace(/^#/, '').trim()
}

function normalizeFilterKey(values: readonly string[]) {
  return Array.from(new Set(values)).sort().join(',')
}

function uniqueById<T>(items: T[], getId: (item: T) => number) {
  const seen = new Set<number>()
  return items.filter((item) => {
    const id = getId(item)
    if (!Number.isFinite(id) || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function useWorksSearch(params: {
  keyword: string
  sort?: WorksSort
  page?: number
  worksTypes?: SearchWorksType[]
  genres?: SearchGenre[]
}) {
  const keyword = normalizeKeyword(params.keyword)
  const sort = params.sort ?? 'NAME'
  const page = params.page ?? 0
  const worksTypes = params.worksTypes ?? []
  const genres = params.genres ?? []

  return useQuery({
    queryKey: [
      'search',
      'works',
      keyword,
      sort,
      page,
      normalizeFilterKey(worksTypes),
      normalizeFilterKey(genres),
    ],
    enabled: !!keyword,
    retry: false,
    queryFn: () =>
      getWorksSearch({ keyword, sort, page, worksTypes, genres }),
  })
}

export function useWorksSearchInfinite(
  keyword: string,
  sort: WorksSort = 'NAME',
  worksTypes: SearchWorksType[] = [],
  genres: SearchGenre[] = [],
) {
  const normalizedKeyword = normalizeKeyword(keyword)
  const worksTypesKey = normalizeFilterKey(worksTypes)
  const genresKey = normalizeFilterKey(genres)

  const query = useInfiniteQuery({
    queryKey: [
      'search',
      'works',
      'infinite',
      normalizedKeyword,
      sort,
      worksTypesKey,
      genresKey,
    ],
    enabled: !!normalizedKeyword,
    initialPageParam: 0,
    retry: false,
    queryFn: ({ pageParam }) =>
      getWorksSearch({
        keyword: normalizedKeyword,
        sort,
        page: Number(pageParam),
        worksTypes,
        genres,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.result.last || lastPage.result.empty) return undefined
      return (lastPage.result.number ?? 0) + 1
    },
  })

  const items = uniqueById(
    query.data?.pages.flatMap((page) => page.result.content) ?? [],
    (item) => item.worksId,
  )

  return {
    ...query,
    items: items as WorksSearchItem[],
  }
}

export function useTopicRoomSearchInfinite(
  keyword: string,
  sort: TopicRoomSort = 'DEFAULT',
  worksTypes: SearchWorksType[] = [],
  genres: SearchGenre[] = [],
) {
  const normalizedKeyword = normalizeKeyword(keyword)
  const worksTypesKey = normalizeFilterKey(worksTypes)
  const genresKey = normalizeFilterKey(genres)

  const query = useInfiniteQuery({
    queryKey: [
      'search',
      'topicroom',
      'infinite',
      normalizedKeyword,
      sort,
      worksTypesKey,
      genresKey,
    ],
    enabled: !!normalizedKeyword,
    initialPageParam: 0,
    retry: false,
    queryFn: ({ pageParam }) =>
      getTopicRoomSearch({
        keyword: normalizedKeyword,
        sort,
        page: Number(pageParam),
        worksTypes,
        genres,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.result.last || lastPage.result.empty) return undefined
      return (lastPage.result.number ?? 0) + 1
    },
  })

  const items = uniqueById(
    query.data?.pages.flatMap((page) => page.result.content) ?? [],
    (item) => item.topicRoomId,
  )

  return {
    ...query,
    items: items as TopicRoomSearchItem[],
  }
}

export function useTrendingKeywords() {
  return useQuery({
    queryKey: ['search', 'trending'],
    queryFn: getTrendingKeywords,
    staleTime: 60_000,
    retry: false,
  })
}

export function useRecentKeywords() {
  return useQuery({
    queryKey: ['search', 'recent'],
    queryFn: getRecentKeywords,
    staleTime: 60_000,
    retry: false,
  })
}

export function useDeleteRecentKeyword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyword: string) => deleteRecentKeyword(keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'recent'] })
    },
  })
}

export function useDeleteAllRecentKeywords() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAllRecentKeywords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'recent'] })
    },
  })
}
