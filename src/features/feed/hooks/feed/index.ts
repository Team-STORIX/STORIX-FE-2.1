import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAllBoards,
  getBoardsByWorksId,
  type FeedSort,
  type PageResult,
} from '../../api/feed/readerBoard.api'
import {
  deleteAllFeedRecentKeywords,
  deleteFeedRecentKeyword,
  getFeedRecentKeywords,
  searchBoards,
} from '../../api/feed/feedSearch.api'
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

// Kept under ['feed', 'boards'] so deleting a board or blocking a user refreshes results too.
export function useSearchBoards(keyword: string) {
  return useInfiniteQuery({
    queryKey: ['feed', 'boards', 'search', keyword],
    queryFn: ({ pageParam }) => searchBoards({ keyword, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextPageOf,
    enabled: keyword.length > 0,
    retry: false,
  })
}

export const feedRecentKeywordsQueryKey = ['feed', 'search', 'recent'] as const
type FeedRecentKeywords = Awaited<ReturnType<typeof getFeedRecentKeywords>>

export function useFeedRecentKeywords() {
  return useQuery({
    queryKey: feedRecentKeywordsQueryKey,
    queryFn: getFeedRecentKeywords,
    staleTime: 60_000,
    retry: false,
  })
}

function useOptimisticRecentKeywords<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  remove: (keywords: string[], variables: TVariables) => string[],
) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await qc.cancelQueries({ queryKey: feedRecentKeywordsQueryKey })
      const previous = qc.getQueryData<FeedRecentKeywords>(feedRecentKeywordsQueryKey)
      qc.setQueryData<FeedRecentKeywords>(feedRecentKeywordsQueryKey, (current) => ({
        recentKeywords: remove(current?.recentKeywords ?? [], variables),
      }))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) qc.setQueryData(feedRecentKeywordsQueryKey, context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: feedRecentKeywordsQueryKey })
    },
  })
}

export function useDeleteFeedRecentKeyword() {
  return useOptimisticRecentKeywords<string>(deleteFeedRecentKeyword, (keywords, keyword) =>
    keywords.filter((item) => item !== keyword),
  )
}

export function useDeleteAllFeedRecentKeywords() {
  return useOptimisticRecentKeywords<void>(deleteAllFeedRecentKeywords, () => [])
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
