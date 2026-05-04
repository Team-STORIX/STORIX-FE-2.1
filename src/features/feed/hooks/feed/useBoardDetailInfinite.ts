import { useInfiniteQuery } from '@tanstack/react-query'
import { getBoardDetail } from '../../api/feed/readerBoardDetail.api'

export function useBoardDetailInfinite(boardId: number) {
  return useInfiniteQuery({
    queryKey: ['feed', 'boardDetail', boardId],
    enabled: Number.isFinite(boardId) && boardId > 0,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getBoardDetail({
        boardId,
        page: pageParam as number,
        sort: 'LATEST',
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.comment.last ? undefined : (lastPageParam as number) + 1,
  })
}
