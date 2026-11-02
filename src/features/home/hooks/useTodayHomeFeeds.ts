import { useQuery, type QueryClient } from '@tanstack/react-query'
import { getTodayHomeFeeds } from '../api/home.api'
import type { TodayFeedItem } from '../api/home.schema'

export const TODAY_HOME_FEEDS_QUERY_KEY = ['home', 'feeds', 'today'] as const

export function updateTodayHomeFeedBoard(
  queryClient: QueryClient,
  boardId: number,
  updater: (board: TodayFeedItem['board']) => TodayFeedItem['board'],
) {
  queryClient.setQueryData<TodayFeedItem[]>(
    TODAY_HOME_FEEDS_QUERY_KEY,
    (prev) =>
      prev?.map((item) =>
        item.board.boardId === boardId
          ? { ...item, board: updater(item.board) }
          : item,
      ),
  )
}

export const useTodayHomeFeeds = () =>
  useQuery({
    queryKey: TODAY_HOME_FEEDS_QUERY_KEY,
    queryFn: getTodayHomeFeeds,
  })
