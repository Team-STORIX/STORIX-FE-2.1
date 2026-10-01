import type { QueryClient } from '@tanstack/react-query'
import { updateTodayHomeFeedBoard } from '../../home'
import type { FeedBoardImage } from '../api/feed/readerBoard.api'

export type LikeState = { isLiked: boolean; likeCount: number }

export function toggleLikeState(current: LikeState): LikeState {
  return {
    isLiked: !current.isLiked,
    likeCount: Math.max(0, current.likeCount + (current.isLiked ? -1 : 1)),
  }
}

/** Image URLs of a board in display order. */
export function sortedImageUrls(images?: FeedBoardImage[] | null) {
  return (images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => image.imageUrl)
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
  ])
}
