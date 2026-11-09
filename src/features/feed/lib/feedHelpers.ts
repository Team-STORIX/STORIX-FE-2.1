import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { updateTodayHomeFeedBoard } from '../../home'
import type { FeedBoardImage, FeedBoardItem, PageResult } from '../api/feed/readerBoard.api'

export type LikeState = { isLiked: boolean; likeCount: number }

export function toggleLikeState(current: LikeState): LikeState {
  return {
    isLiked: !current.isLiked,
    likeCount: Math.max(0, current.likeCount + (current.isLiked ? -1 : 1)),
  }
}

export type BookmarkState = { isBookmarked: boolean; bookmarkCount: number }

export function toggleBookmarkState(current: BookmarkState): BookmarkState {
  return {
    isBookmarked: !current.isBookmarked,
    bookmarkCount: Math.max(0, current.bookmarkCount + (current.isBookmarked ? -1 : 1)),
  }
}

/** Image URLs of a board in display order. */
export function sortedImageUrls(images?: FeedBoardImage[] | null) {
  return (images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => image.imageUrl)
}

type FeedBoardsData = InfiniteData<PageResult<FeedBoardItem>>

/**
 * Patch one board in every cached feed list (all boards, per-works, search).
 * Untouched pages keep their identity so FlatList only re-renders the changed row.
 */
export function updateFeedBoardsCache(
  qc: QueryClient,
  boardId: number,
  updater: (board: FeedBoardItem['board']) => FeedBoardItem['board'],
) {
  qc.setQueriesData<FeedBoardsData>({ queryKey: ['feed', 'boards'] }, (data) => {
    if (!data) return data
    let changed = false
    const pages = data.pages.map((page) => {
      const index = page.content.findIndex((item) => item.board.boardId === boardId)
      if (index === -1) return page
      changed = true
      const content = page.content.slice()
      content[index] = { ...content[index], board: updater(content[index].board) }
      return { ...page, content }
    })
    return changed ? { ...data, pages } : data
  })
}

/** Mirror a board's like state into the home "today feed" cache. */
export function syncHomeBoardLike(qc: QueryClient, boardId: number, like: LikeState) {
  updateTodayHomeFeedBoard(qc, boardId, (board) => ({ ...board, ...like }))
}

/** Shift a board's reply count in the home "today feed" cache. */
export function syncHomeBoardReplyCount(qc: QueryClient, boardId: number, delta: number) {
  updateTodayHomeFeedBoard(qc, boardId, (board) => ({
    ...board,
    replyCount: Math.max(0, board.replyCount + delta),
  }))
}

/** Refresh every list that may still show content from a user who was just blocked. */
export function invalidateAfterBlock(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['feed', 'boards'] }),
    qc.invalidateQueries({ queryKey: ['topicroom'] }),
    qc.invalidateQueries({ queryKey: ['worksReviews'] }),
    qc.invalidateQueries({ queryKey: ['profile', 'other-users'] }),
  ])
}
