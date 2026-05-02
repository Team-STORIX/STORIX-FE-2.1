import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAllRecentKeywords,
  deleteRecentKeyword,
  getRecentKeywords,
  getTopicRoomSearch,
  getTrendingKeywords,
  getWorksSearch,
} from '../api/search.api'
import type {
  SearchGenre,
  SearchWorksType,
  TopicRoomSearchItem,
  TopicRoomSort,
  WorksSearchItem,
  WorksSort,
} from '../api/search.schema'

// ─── Shared pagination types ─────────────────────────────────────────────────

type SliceMeta = {
  number: number
  size: number
  last: boolean
  empty: boolean
  numberOfElements: number
  contentLen: number
}

type PagerResult<T> = {
  items: T[]
  meta: SliceMeta | null
  isLoading: boolean
  isFetching: boolean
  error: unknown
  hasNext: boolean
  requestNext: () => void
  reset: () => void
}

const shouldStop = (meta: {
  last: boolean
  empty: boolean
  contentLen: number
}) => meta.last || meta.empty || meta.contentLen === 0

// ─── useWorksSearchInfinite ───────────────────────────────────────────────────
// Manual page-based pager (not useInfiniteQuery) so the caller drives pagination
// explicitly via requestNext() — suitable for RN FlatList onEndReached.

export const useWorksSearchInfinite = (
  keyword: string,
  sort: WorksSort = 'NAME',
  worksTypes: SearchWorksType[] = [],
  genres: SearchGenre[] = [],
): PagerResult<WorksSearchItem> => {
  const k = keyword.trim()
  const worksTypesKey = worksTypes.join(',')
  const genresKey = genres.join(',')

  const [page, setPage] = useState(0)
  const pageRef = useRef(0)
  const [items, setItems] = useState<WorksSearchItem[]>([])
  const [meta, setMeta] = useState<SliceMeta | null>(null)
  const [hasNext, setHasNext] = useState(false)

  const requestedPagesRef = useRef<Set<number>>(new Set())
  const seenIdsRef = useRef<Set<number>>(new Set())
  const loadingRef = useRef(false)
  const stopRef = useRef(false)

  useEffect(() => { pageRef.current = page }, [page])

  const reset = () => {
    setPage(0)
    pageRef.current = 0
    setItems([])
    setMeta(null)
    setHasNext(false)
    requestedPagesRef.current.clear()
    seenIdsRef.current.clear()
    loadingRef.current = false
    stopRef.current = false
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reset() }, [k, sort, worksTypesKey, genresKey])

  const shouldFetch =
    k.length > 0 && !stopRef.current && !requestedPagesRef.current.has(page)

  const query = useQuery({
    queryKey: ['search', 'works', k, sort, page, worksTypes, genres],
    enabled: shouldFetch,
    retry: false,
    queryFn: async () => {
      requestedPagesRef.current.add(page)
      return getWorksSearch({ keyword: k, sort, page, worksTypes, genres })
    },
  })

  useEffect(() => { loadingRef.current = query.isFetching }, [query.isFetching])

  useEffect(() => {
    const data = query.data
    if (!data) return
    const r = data.result
    const nextMeta: SliceMeta = {
      number: r.number,
      size: r.size,
      last: r.last,
      empty: r.empty,
      numberOfElements: r.numberOfElements,
      contentLen: r.content.length,
    }
    if (r.content.length > 0) {
      const appended: WorksSearchItem[] = []
      for (const w of r.content) {
        const id = Number((w as any).worksId)
        if (!Number.isFinite(id) || seenIdsRef.current.has(id)) continue
        seenIdsRef.current.add(id)
        appended.push(w)
      }
      if (appended.length > 0) setItems((prev) => [...prev, ...appended])
    }
    setMeta(nextMeta)
    const stop = shouldStop(nextMeta)
    stopRef.current = stop
    setHasNext(!stop)
  }, [query.data])

  const requestNext = () => {
    if (!k || stopRef.current || loadingRef.current) return
    const next = pageRef.current + 1
    if (!requestedPagesRef.current.has(next)) setPage(next)
  }

  return {
    items,
    meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    hasNext,
    requestNext,
    reset,
  }
}

// ─── useTopicRoomSearchInfinite ───────────────────────────────────────────────

export const useTopicRoomSearchInfinite = (
  keyword: string,
  sort: TopicRoomSort = 'DEFAULT',
  worksTypes: SearchWorksType[] = [],
  genres: SearchGenre[] = [],
): PagerResult<TopicRoomSearchItem> => {
  const k = keyword.trim()
  const worksTypesKey = worksTypes.join(',')
  const genresKey = genres.join(',')

  const [page, setPage] = useState(0)
  const pageRef = useRef(0)
  const [items, setItems] = useState<TopicRoomSearchItem[]>([])
  const [meta, setMeta] = useState<SliceMeta | null>(null)
  const [hasNext, setHasNext] = useState(false)

  const requestedPagesRef = useRef<Set<number>>(new Set())
  const seenIdsRef = useRef<Set<number>>(new Set())
  const loadingRef = useRef(false)
  const stopRef = useRef(false)

  useEffect(() => { pageRef.current = page }, [page])

  const reset = () => {
    setPage(0)
    pageRef.current = 0
    setItems([])
    setMeta(null)
    setHasNext(false)
    requestedPagesRef.current.clear()
    seenIdsRef.current.clear()
    loadingRef.current = false
    stopRef.current = false
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reset() }, [k, sort, worksTypesKey, genresKey])

  const shouldFetch =
    k.length > 0 && !stopRef.current && !requestedPagesRef.current.has(page)

  const query = useQuery({
    queryKey: ['search', 'topicroom', k, sort, page, worksTypes, genres],
    enabled: shouldFetch,
    retry: false,
    queryFn: async () => {
      requestedPagesRef.current.add(page)
      return getTopicRoomSearch({ keyword: k, sort, page, worksTypes, genres })
    },
  })

  useEffect(() => { loadingRef.current = query.isFetching }, [query.isFetching])

  useEffect(() => {
    const data = query.data
    if (!data) return
    const r = data.result
    const nextMeta: SliceMeta = {
      number: r.number,
      size: r.size,
      last: r.last,
      empty: r.empty,
      numberOfElements: r.numberOfElements,
      contentLen: r.content.length,
    }
    if (r.content.length > 0) {
      const appended: TopicRoomSearchItem[] = []
      for (const item of r.content) {
        const id = Number(item.topicRoomId)
        if (!Number.isFinite(id) || seenIdsRef.current.has(id)) continue
        seenIdsRef.current.add(id)
        appended.push(item)
      }
      if (appended.length > 0) setItems((prev) => [...prev, ...appended])
    }
    setMeta(nextMeta)
    const stop = shouldStop(nextMeta)
    stopRef.current = stop
    setHasNext(!stop)
  }, [query.data])

  const requestNext = () => {
    if (!k || stopRef.current || loadingRef.current) return
    const next = pageRef.current + 1
    if (!requestedPagesRef.current.has(next)) setPage(next)
  }

  return {
    items,
    meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    hasNext,
    requestNext,
    reset,
  }
}

// ─── Simple query / mutation hooks ───────────────────────────────────────────

export const useTrendingKeywords = () =>
  useQuery({
    queryKey: ['search', 'trending'],
    queryFn: getTrendingKeywords,
    retry: false,
  })

export const useRecentKeywords = () =>
  useQuery({
    queryKey: ['search', 'recent'],
    queryFn: getRecentKeywords,
    retry: false,
  })

export const useDeleteRecentKeyword = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keyword: string) => deleteRecentKeyword(keyword),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search', 'recent'] }),
  })
}

export const useDeleteAllRecentKeywords = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAllRecentKeywords,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search', 'recent'] }),
  })
}
