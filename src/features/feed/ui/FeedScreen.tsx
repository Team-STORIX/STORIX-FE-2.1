import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAllBoards } from '../hooks/feed/useAllBoards'
import { useBoardsByWorksId } from '../hooks/feed/useBoardsByWorksId'
import { useFavoriteWorks } from '../hooks/feed/useFavoriteWorks'
import { toggleBoardLike, reportBoard, deleteBoard } from '../api/feed/readerBoard.api'
import type { FeedBoardItem } from '../api/feed/readerBoard.api'
import { useMe } from '../../profile'
import { C, Gray, Magenta } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'
import { TopicRoomFeedSection } from '../../topicroom/ui/TopicRoomFeedSection'
import { FeedPostCard } from './FeedPostCard'
import { FeedTopbar, type FeedTab } from './FeedTopbar'
import { FeedWorksPicker } from './FeedWorksPicker'
import { FeedDeleteConfirmModal } from './FeedDeleteConfirmModal'
import { UserActionModal } from '../../../components/common/UserActionModal'
import { blockUser } from '../../users/api/users.api'
import { subscribeFeedTabReselected } from '../../navigation/services/tabScrollEvents'
import {
  TopicRoomWorksPickerBottomSheet,
  type PickedWorks,
} from '../../topicroom'
import { updateTodayHomeFeedBoard } from '../../home'

type LikeOverride = { isLiked: boolean; likeCount: number }
const warningIcon = require('../../../../assets/icons/profile/warning.svg')

export function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const listRef = useRef<FlatList<FeedBoardItem> | null>(null)

  // Home section arrows pin the landing tab explicitly.
  const params = useLocalSearchParams<{
    section?: string | string[]
    landingKey?: string | string[]
  }>()
  const sectionParam = Array.isArray(params.section)
    ? params.section[0]
    : params.section
  const landingKeyParam = Array.isArray(params.landingKey)
    ? params.landingKey[0]
    : params.landingKey

  const sectionTab: FeedTab =
    sectionParam === 'topicroom' ? 'writers' : 'works'

  const [tab, setTab] = useState<FeedTab>(sectionTab)
  const [pick, setPick] = useState<string>('all')

  useEffect(() => {
    setTab(sectionTab)
    setPick('all')
  }, [landingKeyParam, sectionParam, sectionTab])

  useEffect(() => {
    return subscribeFeedTabReselected(() => {
      setTab('works')
      listRef.current?.scrollToOffset({ offset: 0, animated: true })
    })
  }, [])
  const [reportTarget, setReportTarget] = useState<{
    profileImageUrl?: string | null
    nickname: string
    onConfirm: () => Promise<void>
  } | null>(null)

  const [blockTarget, setBlockTarget] = useState<{
    profileImageUrl?: string | null
    nickname: string
    onConfirm: () => Promise<void>
  } | null>(null)
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null)
  const [topicRoomPickerOpen, setTopicRoomPickerOpen] = useState(false)

  const handlePressSearchTopicRoom = useCallback(() => {
    router.push('/search?tab=topicroom' as never)
  }, [router])

  const handlePressAddTopicRoom = useCallback(() => {
    setTopicRoomPickerOpen(true)
  }, [])

  const handlePickTopicRoomWork = useCallback(
    (work: PickedWorks) => {
      setTopicRoomPickerOpen(false)
      router.push({
        pathname: '/topicroom/create',
        params: {
          worksId: String(work.worksId),
          worksName: work.worksName,
          thumbnailUrl: work.thumbnailUrl ?? '',
          artistName: work.artistName ?? '',
          worksType: work.worksType ?? '',
        },
      })
    },
    [router],
  )

  const worksId = pick !== 'all' ? Number(pick) : 0

  const allBoardsQuery = useAllBoards()
  const worksBoardsQuery = useBoardsByWorksId(worksId)
  const favoriteWorksQuery = useFavoriteWorks()
  const { data: me } = useMe()
  const currentUserId = me?.userId

  const activeQuery = pick === 'all' ? allBoardsQuery : worksBoardsQuery
  const items: FeedBoardItem[] =
    activeQuery.data?.pages.flatMap((p) => p.content) ?? []

  // ── Optimistic like state ────────────────────────────────────────────────────
  const likeOverrides = useRef<Map<number, LikeOverride>>(new Map())
  const [, forceUpdate] = useState(0)

  const handleToggleLike = useCallback(
    async (boardId: number, currentIsLiked: boolean, currentCount: number) => {
      const nextLiked = !currentIsLiked
      const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1))
      likeOverrides.current.set(boardId, { isLiked: nextLiked, likeCount: nextCount })
      updateTodayHomeFeedBoard(qc, boardId, (board) => ({
        ...board,
        isLiked: nextLiked,
        likeCount: nextCount,
      }))
      forceUpdate((n) => n + 1)
      try {
        const result = await toggleBoardLike(boardId)
        if (result != null) {
          likeOverrides.current.set(boardId, {
            isLiked: result.isLiked,
            likeCount: result.likeCount,
          })
          updateTodayHomeFeedBoard(qc, boardId, (board) => ({
            ...board,
            isLiked: result.isLiked,
            likeCount: result.likeCount,
          }))
          forceUpdate((n) => n + 1)
          qc.invalidateQueries({ queryKey: ['profile', 'activity', 'likes'] })
        }
      } catch {
        likeOverrides.current.set(boardId, {
          isLiked: currentIsLiked,
          likeCount: currentCount,
        })
        updateTodayHomeFeedBoard(qc, boardId, (board) => ({
          ...board,
          isLiked: currentIsLiked,
          likeCount: currentCount,
        }))
        forceUpdate((n) => n + 1)
      }
    },
    [qc],
  )

  // ── Report / Delete / Block ──────────────────────────────────────────────────
  const handleReport = useCallback(
    (boardId: number, writerUserId: number, reportedProfile: { profileImageUrl?: string | null; nickName: string }) => {
      setReportTarget({
        profileImageUrl: reportedProfile.profileImageUrl,
        nickname: reportedProfile.nickName,
        onConfirm: async () => {
          const result = await reportBoard({ boardId, reportedUserId: writerUserId })
          if (result.status === 'duplicated') {
            throw new Error('이미 신고한 유저예요.')
          }
        },
      })
    },
    [],
  )

  const handleBlock = useCallback(
    (writerUserId: number, blockedProfile: { profileImageUrl?: string | null; nickName: string }) => {
      setBlockTarget({
        profileImageUrl: blockedProfile.profileImageUrl,
        nickname: blockedProfile.nickName,
        onConfirm: async () => {
          await blockUser(writerUserId)
          // 차단 후 모든 관련 쿼리 새로고침
          qc.invalidateQueries({ queryKey: ['allBoards'] })
          qc.invalidateQueries({ queryKey: ['boardsByWorksId'] })
          qc.invalidateQueries({ queryKey: ['boardComments'] })
          qc.invalidateQueries({ queryKey: ['topicroom'] })
          qc.invalidateQueries({ queryKey: ['worksReviews'] })
          // 즉시 피드 새로고침
          await activeQuery.refetch()
        },
      })
    },
    [qc, activeQuery],
  )

  const handleDelete = useCallback((boardId: number) => {
    setDeleteBoardId(boardId)
  }, [])

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

  // ── Pagination ───────────────────────────────────────────────────────────────
  const onEndReached = useCallback(() => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage()
    }
  }, [activeQuery])

  // ── Render ───────────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: FeedBoardItem; index: number }) => {
      const { board, profile, works, images } = item
      const override = likeOverrides.current.get(board.boardId)
      const isLiked = override?.isLiked ?? board.isLiked
      const likeCount = override?.likeCount ?? board.likeCount

      const worksIdForNav =
        board.isWorksSelected && board.worksId != null && board.worksId > 0
          ? board.worksId
          : null

      const isMine = currentUserId != null && profile.userId === currentUserId

      return (
        <FeedPostCard
          variant="list"
          boardId={board.boardId}
          writerUserId={profile.userId}
          currentUserId={currentUserId}
          profileImageUrl={profile.profileImageUrl}
          nickName={profile.nickName}
          createdAt={board.lastCreatedTime ?? undefined}
          content={board.content}
          images={(images ?? [])
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((x) => x.imageUrl)}
          works={
            works != null
              ? {
                  thumbnailUrl: works.thumbnailUrl,
                  worksName: works.worksName,
                  artistName: works.artistName,
                  worksType: works.worksType,
                  genre: works.genre,
                  hashtags: works.hashtags ?? [],
                }
              : null
          }
          isSpoiler={board.isSpoiler ?? false}
          spoilerScript={board.spoilerScript}
          isLiked={isLiked}
          likeCount={likeCount}
          replyCount={board.replyCount}
          onToggleLike={() =>
            handleToggleLike(board.boardId, isLiked, likeCount)
          }
          onClickWorksArrow={
            worksIdForNav != null
              ? () => router.push(`/works/${worksIdForNav}` as const)
              : undefined
          }
          onOpenReport={
            !isMine
              ? () => handleReport(board.boardId, profile.userId, profile)
              : undefined
          }
          onOpenBlock={
            !isMine
              ? () => handleBlock(profile.userId, profile)
              : undefined
          }
          onOpenDelete={
            isMine ? () => handleDelete(board.boardId) : undefined
          }
          onPressCard={() => router.push(`/feed/${board.boardId}` as never)}
          birthdayTheme={board.theme === 'BIRTHDAY'}
        />
      )
    },
    [
      currentUserId,
      handleDelete,
      handleReport,
      handleBlock,
      handleToggleLike,
      likeOverrides,
      router,
    ],
  )

  const favoriteWorks = favoriteWorksQuery.data ?? []

  const listHeader = (
    <View style={styles.listHeader}>
      <FeedTopbar
        activeTab={tab}
        onChange={(t) => {
          setTab(t)
          setPick('all')
        }}
      />
      {tab === 'works' && (
        <FeedWorksPicker
          works={favoriteWorks}
          selectedId={pick}
          onSelect={setPick}
        />
      )}
    </View>
  )

  const reportModal = (
    <UserActionModal
      type="report"
      visible={reportTarget != null}
      profileImageUrl={reportTarget?.profileImageUrl}
      nickname={reportTarget?.nickname ?? ''}
      onClose={() => setReportTarget(null)}
      onConfirm={reportTarget?.onConfirm ?? (() => Promise.resolve())}
    />
  )

  const blockModal = (
    <UserActionModal
      type="block"
      visible={blockTarget != null}
      profileImageUrl={blockTarget?.profileImageUrl}
      nickname={blockTarget?.nickname ?? ''}
      onClose={() => setBlockTarget(null)}
      onConfirm={blockTarget?.onConfirm ?? (() => Promise.resolve())}
    />
  )

  const deleteModal = (
    <FeedDeleteConfirmModal
      type="post"
      visible={deleteBoardId != null}
      onClose={() => setDeleteBoardId(null)}
      onConfirm={confirmDeleteBoard}
    />
  )

  if (tab === 'writers') {
    return (
      <>
        <View style={[styles.topicroomScreen, { paddingTop: insets.top }]}>
          <FeedTopbar
            activeTab={tab}
            onChange={(t) => {
              setTab(t)
              setPick('all')
            }}
            onPressSearch={handlePressSearchTopicRoom}
            onPressAddTopicRoom={handlePressAddTopicRoom}
          />
          <ScrollView
            style={styles.topicroomScroll}
            contentContainerStyle={styles.topicroomContent}
            showsVerticalScrollIndicator={false}
          >
            <TopicRoomFeedSection />
          </ScrollView>
        </View>
        {reportModal}
        {blockModal}
        {deleteModal}
        <TopicRoomWorksPickerBottomSheet
          visible={topicRoomPickerOpen}
          onClose={() => setTopicRoomPickerOpen(false)}
          onPickWork={handlePickTopicRoomWork}
        />
      </>
    )
  }

  return (
    <>
    <FlatList
      ref={listRef}
      style={[styles.screen, { paddingTop: insets.top }]}
      data={items}
      keyExtractor={(item) => `board_${item.board.boardId}`}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        activeQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Magenta[300]} />
          </View>
        ) : activeQuery.isError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>피드를 불러오지 못했어요.</Text>
            <Pressable
              onPress={() => activeQuery.refetch()}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Image source={warningIcon} style={styles.emptyIcon} contentFit="contain" />
            <Text style={styles.emptyTitle}>아직 작성된 글이 없어요</Text>
          </View>
        )
      }
      ListFooterComponent={
        activeQuery.isFetchingNextPage ? (
          <ActivityIndicator
            size="small"
            color={Magenta[300]}
            style={styles.footerLoader}
          />
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        items.length === 0 && !activeQuery.isLoading && !activeQuery.isError
          ? styles.emptyContent
          : null,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={activeQuery.isRefetching && !activeQuery.isFetchingNextPage}
          onRefresh={() => activeQuery.refetch()}
          tintColor={Magenta[300]}
          colors={[Magenta[300]]}
        />
      }
    />
    {reportModal}
    {blockModal}
    {deleteModal}
    </>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  topicroomScreen: {
    flex: 1,
    backgroundColor: Gray[50],
  },
  topicroomScroll: {
    flex: 1,
    backgroundColor: Gray[50],
  },
  content: {
    paddingBottom: 128,
  },
  emptyContent: {
    flexGrow: 1,
  },
  listHeader: {
    backgroundColor: C.card,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  errorText: {
    ...Typography.body2Medium,
    color: Gray[600],
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: Magenta[300],
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: {
    ...Typography.body2Medium,
    color: C.card,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 100,
    height: 100,
  },
  emptyTitle: {
    marginTop: 20,
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
  },
  topicroomContent: {
    flexGrow: 1,
    backgroundColor: Gray[50],
    paddingBottom: 128,
  },
})
