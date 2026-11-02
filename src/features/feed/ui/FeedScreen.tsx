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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAllBoards, useBoardsByWorksId, useFavoriteWorks } from '../hooks/feed'
import {
  deleteBoard,
  reportBoard,
  toggleBoardLike,
  type FeedBoardItem,
} from '../api/feed/readerBoard.api'
import { useMe } from '../../profile'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { TopicRoomFeedSection } from '../../topicroom/ui/TopicRoomFeedSection'
import { FeedPostCard } from './FeedPostCard'
import { FeedTopbar, type FeedTab } from './FeedTopbar'
import { FeedWorksPicker } from './FeedWorksPicker'
import { FeedDeleteConfirmModal } from './FeedDeleteConfirmModal'
import { useUserActionModals } from './UserActionModals'
import { blockUser } from '../../users/api/users.api'
import { subscribeFeedTabReselected } from '../../navigation/services/tabScrollEvents'
import {
  TopicRoomWorksPickerBottomSheet,
  type PickedWorks,
  useTopicRoomUnreadStatus,
} from '../../topicroom'
import { trackScreenView } from '../../../lib/analytics/events'
import {
  invalidateAfterBlock,
  sortedImageUrls,
  syncHomeBoardLike,
  toggleLikeState,
  type LikeState,
} from '../lib/feedHelpers'

const warningIcon = require('../../../../assets/icons/profile/warning.svg')

const firstParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)

export function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const listRef = useRef<FlatList<FeedBoardItem> | null>(null)

  // Home section arrows pin the landing tab explicitly.
  const params = useLocalSearchParams<{ section?: string | string[]; landingKey?: string | string[] }>()
  const sectionParam = firstParam(params.section)
  const landingKeyParam = firstParam(params.landingKey)
  const sectionTab: FeedTab = sectionParam === 'topicroom' ? 'writers' : 'works'

  const [tab, setTab] = useState<FeedTab>(sectionTab)
  const [pick, setPick] = useState('all')
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null)
  const [topicRoomPickerOpen, setTopicRoomPickerOpen] = useState(false)
  const { openReport, openBlock, modals: userActionModals } = useUserActionModals()
  const { data: topicRoomUnreadStatus, refetch: refetchTopicRoomUnreadStatus } =
    useTopicRoomUnreadStatus()

  useFocusEffect(
    useCallback(() => {
      void refetchTopicRoomUnreadStatus()
      void qc.invalidateQueries({ queryKey: ['topicroom', 'me'] })
    }, [qc, refetchTopicRoomUnreadStatus]),
  )

  useFocusEffect(
    useCallback(() => {
      void trackScreenView('feed')
    }, []),
  )

  useEffect(() => {
    setTab(sectionTab)
    setPick('all')
  }, [landingKeyParam, sectionParam, sectionTab])

  useEffect(
    () =>
      subscribeFeedTabReselected(() => {
        setTab('works')
        listRef.current?.scrollToOffset({ offset: 0, animated: true })
      }),
    [],
  )

  const changeTab = useCallback((next: FeedTab) => {
    setTab(next)
    setPick('all')
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
  const items = activeQuery.data?.pages.flatMap((page) => page.content) ?? []

  // ── Optimistic like state ────────────────────────────────────────────────────
  const likeOverrides = useRef<Map<number, LikeState>>(new Map())
  const [, forceUpdate] = useState(0)

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

  // ── Pagination ───────────────────────────────────────────────────────────────
  const onEndReached = useCallback(() => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage()
    }
  }, [activeQuery])

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

  if (tab === 'writers') {
    return (
      <>
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <FeedTopbar
            activeTab={tab}
            hasUnreadTopicRooms={topicRoomUnreadStatus?.hasUnread ?? false}
            onChange={changeTab}
            onPressSearch={() => router.push('/search?tab=topicroom' as never)}
            onPressAddTopicRoom={() => setTopicRoomPickerOpen(true)}
          />
          <ScrollView
            style={styles.topicroomScroll}
            contentContainerStyle={styles.topicroomContent}
            showsVerticalScrollIndicator={false}
          >
            <TopicRoomFeedSection />
          </ScrollView>
        </View>
        {modals}
        <TopicRoomWorksPickerBottomSheet
          visible={topicRoomPickerOpen}
          onClose={() => setTopicRoomPickerOpen(false)}
          onPickWork={handlePickTopicRoomWork}
        />
      </>
    )
  }

  const isEmpty = items.length === 0 && !activeQuery.isLoading && !activeQuery.isError

  return (
    <>
      <FlatList
        ref={listRef}
        style={[styles.screen, { paddingTop: insets.top }]}
        data={items}
        keyExtractor={(item) => `board_${item.board.boardId}`}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <FeedTopbar
              activeTab={tab}
              hasUnreadTopicRooms={topicRoomUnreadStatus?.hasUnread ?? false}
              onChange={changeTab}
            />
            <FeedWorksPicker
              works={favoriteWorksQuery.data ?? []}
              selectedId={pick}
              onSelect={setPick}
            />
          </View>
        }
        ListEmptyComponent={
          activeQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Magenta[300]} />
            </View>
          ) : activeQuery.isError ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>피드를 불러오지 못했어요.</Text>
              <Pressable onPress={() => activeQuery.refetch()} style={styles.retryBtn}>
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
          <View style={[styles.listFooter, { height: insets.bottom + 120 }]}>
            {activeQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color={Magenta[300]} style={styles.footerLoader} />
            ) : null}
          </View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isEmpty && styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching && !activeQuery.isFetchingNextPage}
            onRefresh={() => activeQuery.refetch()}
            tintColor={Magenta[300]}
            colors={[Magenta[300]]}
          />
        }
      />
      {modals}
    </>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  topicroomScroll: {
    flex: 1,
    backgroundColor: Gray[50],
  },
  topicroomContent: {
    flexGrow: 1,
    backgroundColor: Gray[50],
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
  listFooter: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  footerLoader: {
    paddingVertical: 16,
  },
})
