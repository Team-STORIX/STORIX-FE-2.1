import { useInfiniteQuery } from '@tanstack/react-query'
import { getBoardsByWorksId } from '../../api/feed/readerBoard.api'
import type { FeedSort } from '../../api/feed/readerBoard.api'

export function useBoardsByWorksId(worksId: number, sort: FeedSort = 'LATEST') {
  return useInfiniteQuery({
    queryKey: ['feed', 'boards', 'works', worksId, sort],
    queryFn: ({ pageParam }) =>
      getBoardsByWorksId({ worksId, page: pageParam as number, sort }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return (lastPage.number ?? 0) + 1
    },
    enabled: worksId > 0,
  })
}
