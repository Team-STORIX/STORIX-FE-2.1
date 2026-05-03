import { useInfiniteQuery } from '@tanstack/react-query'
import { getLibrarySearchWorks } from '../api/library.api'

export const useLibrarySearchWorksInfinite = (keyword: string) =>
  useInfiniteQuery({
    queryKey: ['librarySearchWorks', keyword],
    enabled: !!keyword,
    queryFn: ({ pageParam }) =>
      getLibrarySearchWorks({ keyword, page: Number(pageParam) }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return (lastPage.number ?? 0) + 1
    },
  })
