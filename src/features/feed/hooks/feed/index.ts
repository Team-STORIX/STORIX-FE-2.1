import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  getAllBoards,
  getBoardsByWorksId,
  type FeedSort,
  type PageResult,
} from '../../api/feed/readerBoard.api'
import { getBoardDetail } from '../../api/feed/readerBoardDetail.api'
import { getFavoriteWorks, type FavoriteWorkItem } from '../../api/feed/readerFavoriteWorks.api'

const nextPageOf = (page: PageResult<unknown>) =>
  page.last || page.empty ? undefined : (page.number ?? 0) + 1

export function useAllBoards(sort: FeedSort = 'LATEST') {
  return useInfiniteQuery({
    queryKey: ['feed', 'boards', sort],
    queryFn: ({ pageParam }) => getAllBoards({ page: pageParam, sort }),
    initialPageParam: 0,
    getNextPageParam: nextPageOf,
  })
}

export function useBoardsByWorksId(worksId: number, sort: FeedSort = 'LATEST') {
  return useInfiniteQuery({
    queryKey: ['feed', 'boards', 'works', worksId, sort],
    queryFn: ({ pageParam }) => getBoardsByWorksId({ worksId, page: pageParam, sort }),
    initialPageParam: 0,
    getNextPageParam: nextPageOf,
    enabled: worksId > 0,
  })
}

export function useBoardDetailInfinite(boardId: number) {
  return useInfiniteQuery({
    queryKey: ['feed', 'boardDetail', boardId],
    enabled: Number.isFinite(boardId) && boardId > 0,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getBoardDetail({ boardId, page: pageParam, sort: 'LATEST' }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.comment.last ? undefined : lastPageParam + 1,
  })
}

export function useFavoriteWorks() {
  return useQuery<FavoriteWorkItem[]>({
    queryKey: ['feed', 'favoriteWorks'],
    queryFn: async () => {
      const all: FavoriteWorkItem[] = []
      for (let page = 0; ; page++) {
        const result = await getFavoriteWorks({ page, sort: 'LATEST' })
        all.push(...result.content)
        if (result.last) break
      }
      return all
    },
    staleTime: 5 * 60 * 1_000,
  })
}
