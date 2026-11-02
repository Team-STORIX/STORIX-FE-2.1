import { useInfiniteQuery } from '@tanstack/react-query'
import { getLibrarySearchWorks } from '../api/library.api'

function normalizeKeyword(keyword: string) {
  return keyword.trim()
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

export const useLibrarySearchWorksInfinite = (keyword: string) => {
  const normalizedKeyword = normalizeKeyword(keyword)

  const query = useInfiniteQuery({
    queryKey: ['library', 'search', 'works', 'infinite', normalizedKeyword],
    enabled: !!normalizedKeyword,
    retry: false,
    queryFn: ({ pageParam }) =>
      getLibrarySearchWorks({ keyword: normalizedKeyword, page: Number(pageParam) }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return (lastPage.number ?? 0) + 1
    },
  })

  const items = uniqueById(
    query.data?.pages.flatMap((page) => page.content) ?? [],
    (item) => item.worksId,
  )

  return {
    ...query,
    items,
  }
}
