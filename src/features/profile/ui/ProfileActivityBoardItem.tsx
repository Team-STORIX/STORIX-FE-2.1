import { useState } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { FeedPostCard } from '../../feed/ui/FeedPostCard'
import { ReportModal } from '../../feed/ui/ReportModal'
import { FeedDeleteConfirmModal } from '../../feed/ui/FeedDeleteConfirmModal'
import {
  deleteBoard,
  reportBoard,
  setBoardBookmark,
  toggleBoardLike,
} from '../../feed/api/feed/readerBoard.api'
import type { ProfileActivityBoardItem as ActivityBoardItem } from '../api/profile-activity.api'

export function ProfileActivityBoardCard({
  item,
  currentUserId,
  likedMode = false,
  bookmarkedMode = false,
  queryKey,
}: {
  item: ActivityBoardItem
  currentUserId?: number
  /** "좋아요" tab: un-liking drops the card from the list. */
  likedMode?: boolean
  /** "북마크" tab: un-bookmarking drops the card from the list. */
  bookmarkedMode?: boolean
  queryKey: readonly string[]
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const syncBoardItem = (
    boardId: number,
    updater: (target: ActivityBoardItem) => ActivityBoardItem | null,
  ) => {
    qc.setQueryData(queryKey, (prev: any) => {
      if (!prev?.pages) return prev
      return {
        ...prev,
        pages: prev.pages.map((page: any) => ({
          ...page,
          content: page.content
            .map((entry: ActivityBoardItem) =>
              entry.board.boardId === boardId ? updater(entry) : entry,
            )
            .filter(Boolean),
        })),
      }
    })
  }

  const handleToggleLike = async () => {
    const optimisticLiked = !item.board.isLiked
    const optimisticCount = Math.max(
      0,
      item.board.likeCount + (optimisticLiked ? 1 : -1),
    )

    syncBoardItem(item.board.boardId, (target) =>
      likedMode && !optimisticLiked
        ? null
        : {
            ...target,
            board: {
              ...target.board,
              isLiked: optimisticLiked,
              likeCount: optimisticCount,
            },
          },
    )

    try {
      const result = await toggleBoardLike(item.board.boardId)
      syncBoardItem(item.board.boardId, (target) =>
        likedMode && !result.isLiked
          ? null
          : {
              ...target,
              board: {
                ...target.board,
                isLiked: result.isLiked,
                likeCount: result.likeCount,
              },
            },
      )
    } catch {
      qc.invalidateQueries({ queryKey })
    }
  }

  const handleToggleBookmark = async () => {
    const optimisticBookmarked = !(item.board.isBookmarked ?? false)
    const optimisticCount = Math.max(
      0,
      (item.board.bookmarkCount ?? 0) + (optimisticBookmarked ? 1 : -1),
    )

    syncBoardItem(item.board.boardId, (target) =>
      bookmarkedMode && !optimisticBookmarked
        ? null
        : {
            ...target,
            board: {
              ...target.board,
              isBookmarked: optimisticBookmarked,
              bookmarkCount: optimisticCount,
            },
          },
    )

    try {
      const result = await setBoardBookmark(item.board.boardId, optimisticBookmarked)
      syncBoardItem(item.board.boardId, (target) =>
        bookmarkedMode && !result.isBookmarked
          ? null
          : {
              ...target,
              board: {
                ...target.board,
                isBookmarked: result.isBookmarked,
                bookmarkCount: result.bookmarkCount,
              },
            },
      )
      if (!bookmarkedMode) qc.invalidateQueries({ queryKey: ['profile', 'activity', 'bookmarks'] })
    } catch {
      qc.invalidateQueries({ queryKey })
    }
  }

  const handleDelete = () => {
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    try {
      const result = await deleteBoard(item.board.boardId)
      if (result?.isSuccess === false) {
        throw new Error(result?.message ?? '게시글 삭제에 실패했어요.')
      }
      syncBoardItem(item.board.boardId, () => null)
    } catch {
      Alert.alert('오류', '게시글 삭제에 실패했어요.')
    }
  }

  const handleReport = () => {
    setReportModalVisible(true)
  }

  const worksId = item.works?.worksId

  return (
    <>
    <FeedPostCard
      variant="list"
      boardId={item.board.boardId}
      writerUserId={item.profile.userId}
      currentUserId={currentUserId}
      profileImageUrl={item.profile.profileImageUrl}
      nickName={item.profile.nickName}
      role={item.profile.role}
      createdAt={item.board.lastCreatedTime}
      content={item.board.content}
      images={(item.images ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((image) => image.imageUrl)}
      works={
        item.works
          ? {
              thumbnailUrl: item.works.thumbnailUrl,
              worksName: item.works.worksName,
              artistName: item.works.artistName,
              worksType: item.works.worksType,
              genre: item.works.genre,
              hashtags: item.works.hashtags ?? [],
              isAdultOnly: item.works.isAdultOnly,
            }
          : null
      }
      isSpoiler={item.board.isSpoiler ?? item.isSpoiler ?? false}
      isAdultOnly={item.board.isAdultOnly ?? false}
      isBlinded={item.board.isBlinded}
      spoilerScript={item.board.spoilerScript}
      isLiked={item.board.isLiked}
      likeCount={item.board.likeCount}
      replyCount={item.board.replyCount}
      onToggleLike={() => void handleToggleLike()}
      isBookmarked={item.board.isBookmarked ?? false}
      bookmarkCount={item.board.bookmarkCount ?? 0}
      onToggleBookmark={() => void handleToggleBookmark()}
      onClickWorksArrow={
        worksId
          ? () => router.push(`/works/${worksId}` as const)
          : undefined
      }
      onOpenDelete={item.profile.userId === currentUserId ? handleDelete : undefined}
      onOpenReport={item.profile.userId !== currentUserId ? () => void handleReport() : undefined}
      onPressCard={() => router.push(`/feed/${item.board.boardId}` as const)}
    />
    <ReportModal
      visible={reportModalVisible}
      profileImageUrl={item.profile.profileImageUrl}
      nickname={item.profile.nickName}
      onClose={() => setReportModalVisible(false)}
      onConfirm={async () => {
        const result = await reportBoard({
          boardId: item.board.boardId,
          reportedUserId: item.profile.userId,
        })
        if (result.status === 'duplicated') {
          throw new Error('이미 신고한 유저예요.')
        }
      }}
    />
    <FeedDeleteConfirmModal
      type="post"
      visible={deleteModalVisible}
      onClose={() => setDeleteModalVisible(false)}
      onConfirm={confirmDelete}
    />
    </>
  )
}
