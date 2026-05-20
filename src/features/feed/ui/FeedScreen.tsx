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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAllBoards } from '../hooks/feed/useAllBoards'
import { useBoardsByWorksId } from '../hooks/feed/useBoardsByWorksId'
import { useFavoriteWorks } from '../hooks/feed/useFavoriteWorks'
import { toggleBoardLike, reportBoard, deleteBoard } from '../api/feed/readerBoard.api'
import type { FeedBoardItem } from '../api/feed/readerBoard.api'
import { useMe } from '../../profile'
import { Gray, Magenta } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'
import { WarningEmptyState } from '../../../components/common/WarningEmptyState'
import { TopicRoomFeedSection } from '../../topicroom/ui/TopicRoomFeedSection'
import { FeedPostCard } from './FeedPostCard'
import { FeedTopbar, type FeedTab } from './FeedTopbar'
import { FeedWorksPicker } from './FeedWorksPicker'
import { ReportModal } from './ReportModal'

type LikeOverride = { isLiked: boolean; likeCount: number }

export function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()

  // `section=topicroom` lands the user on the TopicRoom (writers) tab when
  // navigated here from Home's "실시간 작품 이야기" section.
  const params = useLocalSearchParams<{ section?: string | string[] }>()
  const sectionParam = Array.isArray(params.section)
    ? params.section[0]
    : params.section

  const [tab, setTab] = useState<FeedTab>(
    sectionParam === 'topicroom' ? 'writers' : 'works',
  )
  const [pick, setPick] = useState<string>('all')

  useEffect(() => {
    if (sectionParam === 'topicroom') {
      setTab('writers')
      setPick('all')
    }
  }, [sectionParam])
  const [reportTarget, setReportTarget] = useState<{
    profileImageUrl?: string | null
    nickname: string
    onConfirm: () => Promise<void>
  } | null>(null)

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
      forceUpdate((n) => n + 1)
      try {
        const result = await toggleBoardLike(boardId)
        if (result != null) {
          likeOverrides.current.set(boardId, {
            isLiked: result.isLiked,
            likeCount: result.likeCount,
          })
          forceUpdate((n) => n + 1)
        }
      } catch {
        likeOverrides.current.set(boardId, {
          isLiked: currentIsLiked,
          likeCount: currentCount,
        })
        forceUpdate((n) => n + 1)
      }
    },
    [],
  )

  // ── Report / Delete ──────────────────────────────────────────────────────────
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

  const handleDelete = useCallback(
    async (boardId: number) => {
      Alert.alert('삭제', '이 게시글을 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBoard(boardId)
              qc.invalidateQueries({ queryKey: ['feed', 'boards'] })
            } catch {
              Alert.alert('오류', '삭제에 실패했어요.')
            }
          },
        },
      ])
    },
    [qc],
  )

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
          onOpenDelete={
            isMine ? () => handleDelete(board.boardId) : undefined
          }
          onPressCard={() => router.push(`/feed/${board.boardId}` as never)}
          birthdayTheme={index % 2 === 0}
        />
      )
    },
    [
      currentUserId,
      handleDelete,
      handleReport,
      handleToggleLike,
      likeOverrides,
      router,
    ],
  )

  const favoriteWorks = favoriteWorksQuery.data?.result?.content ?? []

  const listHeader = (
    <View style={styles.listHeader}>
      <FeedTopbar activeTab={tab} onChange={(t) => { setTab(t); setPick('all') }} />
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
    <ReportModal
      visible={reportTarget != null}
      profileImageUrl={reportTarget?.profileImageUrl}
      nickname={reportTarget?.nickname ?? ''}
      onClose={() => setReportTarget(null)}
      onConfirm={reportTarget?.onConfirm ?? (() => Promise.resolve())}
    />
  )

  if (tab === 'writers') {
    return (
      <>
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <FeedTopbar
            activeTab={tab}
            onChange={(t) => {
              setTab(t)
              setPick('all')
            }}
          />
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.topicroomContent}
            showsVerticalScrollIndicator={false}
          >
            <TopicRoomFeedSection />
          </ScrollView>
        </View>
        {reportModal}
      </>
    )
  }

  return (
    <>
    <FlatList
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
          <WarningEmptyState description="등록된 피드가 없습니다." />
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
      contentContainerStyle={styles.content}
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
    </>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 128,
  },
  listHeader: {
    backgroundColor: '#ffffff',
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
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  footerLoader: {
    paddingVertical: 16,
  },
  topicroomContent: {
    paddingBottom: 128,
  },
})
