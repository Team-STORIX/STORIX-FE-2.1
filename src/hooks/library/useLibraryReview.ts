import { useInfiniteQuery } from '@tanstack/react-query'
import {
  getLibraryReview,
  type LibraryReviewSort,
} from '../../lib/api/library/library.api'

type Params = { sort?: LibraryReviewSort }

export const useLibraryReviewInfinite = ({ sort = 'LATEST' }: Params = {}) =>
  useInfiniteQuery({
    queryKey: ['libraryReview', sort],
    queryFn: ({ pageParam }) =>
      getLibraryReview({ sort, page: Number(pageParam) }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const slice = lastPage.result
      if (slice.last || slice.empty) return undefined
      return (slice.number ?? 0) + 1
    },
    staleTime: 30_000,
    retry: 0,
  })
