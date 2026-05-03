import { useInfiniteQuery } from '@tanstack/react-query'
import { getAllBoards } from '../../api/feed/readerBoard.api'
import type { FeedSort } from '../../api/feed/readerBoard.api'

export function useAllBoards(sort: FeedSort = 'LATEST') {
  return useInfiniteQuery({
    queryKey: ['feed', 'boards', sort],
    queryFn: ({ pageParam }) =>
      getAllBoards({ page: pageParam as number, sort }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return (lastPage.number ?? 0) + 1
    },
  })
}
