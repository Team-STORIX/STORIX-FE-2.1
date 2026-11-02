import { useCallback, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  deleteBoard,
  reportBoard,
  toggleBoardLike,
  type FeedBoardItem,
} from '../api/feed/readerBoard.api'
import { useMe } from '../../profile'
import { blockUser } from '../../users/api/users.api'
import { FeedPostCard } from './FeedPostCard'
import { FeedDeleteConfirmModal } from './FeedDeleteConfirmModal'
import { useUserActionModals } from './UserActionModals'
import {
  invalidateAfterBlock,
  sortedImageUrls,
  syncHomeBoardLike,
  toggleLikeState,
  type LikeState,
} from '../lib/feedHelpers'

/**
 * Card rendering and per-board actions (like, report, block, delete) shared by
 * every list of feed boards. Render `modals` next to the list and pass
 * `extraData` to the FlatList so optimistic likes repaint.
 */
export function useFeedBoardList() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: me } = useMe()
  const currentUserId = me?.userId
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null)
  const { openReport, openBlock, modals: userActionModals } = useUserActionModals()

  // ── Optimistic like state ────────────────────────────────────────────────────
  const likeOverrides = useRef<Map<number, LikeState>>(new Map())
  const [likeVersion, forceUpdate] = useState(0)

  const handleToggleLike = useCallback(
    async (boardId: number, current: LikeState) => {
      const apply = (like: LikeState) => {
        likeOverrides.current.set(boardId, like)
        syncHomeBoardLike(qc, boardId, like)
        forceUpdate((n) => n + 1)
      }
      apply(toggleLikeState(current))
      try {
        const result = await toggleBoardLike(boardId)
        if (result != null) {
          apply(result)
          qc.invalidateQueries({ queryKey: ['profile', 'activity', 'likes'] })
        }
      } catch {
        apply(current)
      }
    },
    [qc],
  )

  // ── Report / Block / Delete ──────────────────────────────────────────────────
  const handleReport = useCallback(
    ({ board, profile }: FeedBoardItem) =>
      openReport(profile, async () => {
        const result = await reportBoard({ boardId: board.boardId, reportedUserId: profile.userId })
        if (result.status === 'duplicated') return 'duplicate'
      }),
    [openReport],
  )

  const handleBlock = useCallback(
    ({ profile }: FeedBoardItem) =>
      openBlock(profile, async () => {
        await blockUser(profile.userId)
        await invalidateAfterBlock(qc)
      }),
    [openBlock, qc],
  )

  const confirmDeleteBoard = useCallback(async () => {
    if (deleteBoardId == null) return
    try {
      await deleteBoard(deleteBoardId)
      qc.invalidateQueries({ queryKey: ['feed', 'boards'] })
      qc.invalidateQueries({ queryKey: ['profile', 'activity'] })
    } catch {
      Alert.alert('오류', '삭제에 실패했어요.')
    }
  }, [deleteBoardId, qc])

  // ── Render ───────────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: FeedBoardItem }) => {
      const { board, profile, works } = item
      const like = likeOverrides.current.get(board.boardId) ?? {
        isLiked: board.isLiked,
        likeCount: board.likeCount,
      }
      const worksIdForNav =
        board.isWorksSelected && board.worksId != null && board.worksId > 0 ? board.worksId : null
      const isMine = currentUserId != null && profile.userId === currentUserId

      return (
        <FeedPostCard
          variant="list"
          boardId={board.boardId}
          writerUserId={profile.userId}
          currentUserId={currentUserId}
          profileImageUrl={profile.profileImageUrl}
          nickName={profile.nickName}
          role={profile.role}
          createdAt={board.lastCreatedTime}
          content={board.content}
          images={sortedImageUrls(item.images)}
          works={works}
          isSpoiler={board.isSpoiler ?? false}
          isAdultOnly={board.isAdultOnly ?? false}
          isBlinded={board.isBlinded}
          spoilerScript={board.spoilerScript}
          isLiked={like.isLiked}
          likeCount={like.likeCount}
          replyCount={board.replyCount}
          onToggleLike={() => handleToggleLike(board.boardId, like)}
          onClickWorksArrow={
            worksIdForNav != null ? () => router.push(`/works/${worksIdForNav}` as const) : undefined
          }
          onOpenReport={isMine ? undefined : () => handleReport(item)}
          onOpenBlock={isMine ? undefined : () => handleBlock(item)}
          onOpenDelete={isMine ? () => setDeleteBoardId(board.boardId) : undefined}
          onPressCard={() => router.push(`/feed/${board.boardId}` as never)}
          birthdayTheme={board.theme === 'BIRTHDAY'}
        />
      )
    },
    [currentUserId, handleBlock, handleReport, handleToggleLike, router],
  )

  const modals = (
    <>
      {userActionModals}
      <FeedDeleteConfirmModal
        type="post"
        visible={deleteBoardId != null}
        onClose={() => setDeleteBoardId(null)}
        onConfirm={confirmDeleteBoard}
      />
    </>
  )

  return { renderItem, modals, extraData: likeVersion }
}
