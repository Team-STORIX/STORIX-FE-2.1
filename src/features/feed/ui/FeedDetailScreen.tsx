import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'
import { useMe } from '../../profile'
import { isAlreadyReportedError, reportReply } from '../api/feed/readerReply.api'
import {
  createReply,
  createSubReply,
  deleteReply,
  toggleReplyLike,
  type ReplyItem,
} from '../api/feed/readerBoardDetail.api'
import { deleteBoard, reportBoard, toggleBoardLike } from '../api/feed/readerBoard.api'
import { useBoardDetailInfinite } from '../hooks/feed'
import { useLeaveOnAdultVerificationRequired } from '../../../lib/navigation/useLeaveOnAdultVerificationRequired'
import { blockUser } from '../../users/api/users.api'
import { FeedCommentInput, type FeedCommentInputHandle } from './FeedCommentInput'
import { FeedCommentItem } from './FeedCommentItem'
import { FeedPostCard } from './FeedPostCard'
import { FeedDeleteConfirmModal } from './FeedDeleteConfirmModal'
import { useUserActionModals } from './UserActionModals'
import { trackCreateFeedComment } from '../../../lib/analytics/events'
import {
  invalidateAfterBlock,
  sortedImageUrls,
  syncHomeBoardLike,
  syncHomeBoardReplyCount,
  toggleLikeState,
  type LikeState,
} from '../lib/feedHelpers'

const backIcon = require('../../../../assets/icons/common/back.svg')
const warningIcon = require('../../../../assets/icons/profile/warning.svg')

function parsePositiveInt(raw?: string | string[]) {
  const numeric = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

const withLike = (item: ReplyItem, like?: LikeState) =>
  like ? { ...item, reply: { ...item.reply, ...like } } : item

const likeOf = ({ reply }: ReplyItem): LikeState => ({
  isLiked: reply.isLiked,
  likeCount: reply.likeCount,
})

const createdCommentId = (created: unknown) => {
  const id = (created as any)?.replyId ?? (created as any)?.id
  return typeof id === 'number' ? `comment_${id}` : 'comment_unknown'
}

type DeleteTarget = { type: 'post' | 'comment'; replyId?: number; parentReplyId?: number }

export function FeedDetailScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const params = useLocalSearchParams<{ boardId?: string; commentId?: string; from?: string | string[] }>()
  const boardId = parsePositiveInt(params.boardId)
  const targetCommentId = parsePositiveInt(params.commentId)
  const shouldBackToInterestFeed =
    (Array.isArray(params.from) ? params.from[0] : params.from) === 'todayFeed'
  const scrollRef = useRef<ScrollView | null>(null)
  const commentLayoutYRef = useRef<Record<number, number>>({})
  const didScrollToCommentRef = useRef<number | null>(null)
  const commentInputRef = useRef<FeedCommentInputHandle>(null)

  const { data: me } = useMe()
  const myUserId = me?.userId ?? null
  const detailQuery = useBoardDetailInfinite(boardId ?? 0)
  const isLeavingForAdultVerification = useLeaveOnAdultVerificationRequired(detailQuery.error)

  const boardItem = detailQuery.data?.pages[0]?.board
  const replies = useMemo(
    () => detailQuery.data?.pages.flatMap((page) => page.comment.content) ?? [],
    [detailQuery.data?.pages],
  )

  const [commentText, setCommentText] = useState('')
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const [subRepliesMap, setSubRepliesMap] = useState<Record<number, ReplyItem[]>>({})
  const [postLikeOverride, setPostLikeOverride] = useState<LikeState | null>(null)
  const [replyLikeOverrides, setReplyLikeOverrides] = useState<Record<number, LikeState>>({})
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [replyCountDelta, setReplyCountDelta] = useState(0)
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible())
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const { openReport, openBlock, modals: userActionModals } = useUserActionModals()

  const goInterestFeed = useCallback(() => {
    router.replace(`/(tabs)/feed?section=works&landingKey=${Date.now()}` as never)
  }, [router])

  const handleBack = useCallback(() => {
    if (!shouldBackToInterestFeed && router.canGoBack()) {
      router.back()
      return
    }
    goInterestFeed()
  }, [goInterestFeed, router, shouldBackToInterestFeed])

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  useEffect(() => {
    if (!shouldBackToInterestFeed) return undefined
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack()
      return true
    })
    return () => subscription.remove()
  }, [handleBack, shouldBackToInterestFeed])

  useEffect(() => {
    didScrollToCommentRef.current = null
    commentLayoutYRef.current = {}
  }, [boardId, targetCommentId])

  const board = boardItem?.board
  const profile = boardItem?.profile
  const effectivePostLike = postLikeOverride ?? {
    isLiked: board?.isLiked ?? false,
    likeCount: board?.likeCount ?? 0,
  }

  // Deep link to a comment: load pages until it appears, then scroll to it once.
  useEffect(() => {
    if (!targetCommentId || didScrollToCommentRef.current === targetCommentId) return

    const isLoaded = replies.some(
      (item) =>
        item.reply.replyId === targetCommentId ||
        [...(item.childReplies ?? []), ...(subRepliesMap[item.reply.replyId] ?? [])].some(
          (child) => child.reply.replyId === targetCommentId,
        ),
    )

    if (!isLoaded) {
      if (detailQuery.hasNextPage && !detailQuery.isFetchingNextPage) {
        void detailQuery.fetchNextPage()
      }
      return
    }

    const y = commentLayoutYRef.current[targetCommentId]
    if (typeof y !== 'number') return

    didScrollToCommentRef.current = targetCommentId
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })
    })
  }, [detailQuery, replies, subRepliesMap, targetCommentId])

  // ── Likes ────────────────────────────────────────────────────────────────────
  const onTogglePostLike = useCallback(async () => {
    if (!boardId || !board) return
    const apply = (like: LikeState) => {
      setPostLikeOverride(like)
      syncHomeBoardLike(qc, boardId, like)
    }
    apply(toggleLikeState(effectivePostLike))
    try {
      apply(await toggleBoardLike(boardId))
      qc.invalidateQueries({ queryKey: ['profile', 'activity', 'likes'] })
    } catch {
      apply({ isLiked: board.isLiked, likeCount: board.likeCount })
    }
  }, [board, boardId, effectivePostLike, qc])

  const onToggleReplyLike = useCallback(
    async (replyId: number, current: LikeState) => {
      const apply = (like: LikeState) =>
        setReplyLikeOverrides((prev) => ({ ...prev, [replyId]: like }))
      apply(toggleLikeState(current))
      try {
        apply(await toggleReplyLike({ boardId: boardId as number, replyId }))
      } catch {
        apply(current)
      }
    },
    [boardId],
  )

  // ── Report / Block / Delete ──────────────────────────────────────────────────
  const onReportBoard = useCallback(() => {
    if (!boardId || !profile) return
    openReport(profile, async () => {
      const result = await reportBoard({ boardId, reportedUserId: profile.userId })
      if (result.status === 'duplicated') return 'duplicate'
    })
  }, [boardId, openReport, profile])

  const onBlockBoard = useCallback(() => {
    if (!profile) return
    openBlock(profile, async () => {
      await blockUser(profile.userId)
      void invalidateAfterBlock(qc)
      handleBack()
    })
  }, [handleBack, openBlock, profile, qc])

  const onReportReply = useCallback(
    (item: ReplyItem) => {
      if (!boardId) return
      openReport(item.profile, async () => {
        try {
          await reportReply({ boardId, replyId: item.reply.replyId, reportedUserId: item.reply.userId })
        } catch (error) {
          if (isAlreadyReportedError(error)) return 'duplicate'
          throw error
        }
      })
    },
    [boardId, openReport],
  )

  const onBlockReply = useCallback(
    (item: ReplyItem) =>
      openBlock(item.profile, async () => {
        await blockUser(item.reply.userId)
        void invalidateAfterBlock(qc)
        await detailQuery.refetch()
      }),
    [detailQuery, openBlock, qc],
  )

  const confirmDeleteTarget = useCallback(async () => {
    if (!boardId || !deleteTarget) return
    try {
      if (deleteTarget.type === 'post') {
        await deleteBoard(boardId)
        await qc.invalidateQueries({ queryKey: ['feed', 'boards'] })
        await qc.invalidateQueries({ queryKey: ['profile', 'activity'] })
        handleBack()
        return
      }

      const { replyId, parentReplyId } = deleteTarget
      if (replyId == null) return
      await deleteReply({ boardId, replyId })
      setReplyCountDelta((prev) => Math.max(0, prev - 1))
      syncHomeBoardReplyCount(qc, boardId, -1)
      if (parentReplyId != null) {
        setSubRepliesMap((prev) => ({
          ...prev,
          [parentReplyId]: (prev[parentReplyId] ?? []).filter((item) => item.reply.replyId !== replyId),
        }))
      }
      await detailQuery.refetch()
      setReplyCountDelta(0)
      await qc.invalidateQueries({ queryKey: ['profile', 'activity', 'replies'] })
    } catch {
      Alert.alert('오류', '삭제에 실패했어요.')
    }
  }, [boardId, deleteTarget, detailQuery, handleBack, qc])

  // ── Comment submit ───────────────────────────────────────────────────────────
  const onSubmitComment = useCallback(async () => {
    const trimmed = commentText.trim()
    if (!trimmed || !boardId || submitting) return
    setSubmitting(true)

    const track = (created: unknown) =>
      void trackCreateFeedComment({
        post_id: `post_${boardId}`,
        comment_id: createdCommentId(created),
        has_spoiler: false,
      })
    const scrollToEnd = () =>
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
    const syncAfterCreate = async (afterRefetch?: () => void) => {
      await detailQuery.refetch()
      afterRefetch?.()
      setReplyCountDelta(0)
      await qc.invalidateQueries({ queryKey: ['feed', 'boards'] })
      await qc.invalidateQueries({ queryKey: ['profile', 'activity', 'replies'] })
    }

    if (replyTargetId != null) {
      // 대댓글: UI를 먼저 업데이트(true optimistic)하고 API 호출 → 실패 시 rollback
      const targetId = replyTargetId
      const tempId = Date.now()
      const tempReply: ReplyItem = {
        profile: {
          userId: me?.userId ?? 0,
          profileImageUrl: me?.profileImageUrl ?? null,
          nickName: me?.nickName ?? '',
          role: me?.role,
        },
        reply: {
          replyId: tempId,
          userId: me?.userId ?? 0,
          comment: trimmed,
          lastCreatedTime: '방금 전',
          likeCount: 0,
          isLiked: false,
        },
      }
      setSubRepliesMap((prev) => ({ ...prev, [targetId]: [...(prev[targetId] ?? []), tempReply] }))
      setReplyCountDelta((prev) => prev + 1)
      syncHomeBoardReplyCount(qc, boardId, 1)
      setReplyTargetId(null)
      setCommentText('')
      scrollToEnd()
      setSubmitting(false)

      try {
        track(await createSubReply({ boardId, replyId: targetId, comment: trimmed }))
        await syncAfterCreate(() =>
          setSubRepliesMap((prev) => {
            const next = { ...prev }
            delete next[targetId]
            return next
          }),
        )
      } catch {
        setSubRepliesMap((prev) => ({
          ...prev,
          [targetId]: (prev[targetId] ?? []).filter((item) => item.reply.replyId !== tempId),
        }))
        setReplyCountDelta((prev) => Math.max(0, prev - 1))
        syncHomeBoardReplyCount(qc, boardId, -1)
        Alert.alert('오류', '대댓글 등록에 실패했어요. 다시 시도해 주세요.')
      }
      return
    }

    try {
      track(await createReply({ boardId, comment: trimmed }))
      syncHomeBoardReplyCount(qc, boardId, 1)
      await syncAfterCreate()
      setCommentText('')
      scrollToEnd()
    } catch {
      Alert.alert('오류', '댓글 등록에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }, [boardId, commentText, detailQuery, me, qc, replyTargetId, submitting])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!detailQuery.hasNextPage || detailQuery.isFetchingNextPage) return
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
        void detailQuery.fetchNextPage()
      }
    },
    [detailQuery],
  )

  const toggleMenu = (replyId: number) =>
    setOpenMenuId((prev) => (prev === replyId ? null : replyId))

  if (!boardId) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <Text style={styles.messageText}>존재하지 않는 글이에요.</Text>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>
        <Text style={styles.topBarTitle}>피드</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {detailQuery.isLoading || isLeavingForAdultVerification ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Magenta[300]} />
        </View>
      ) : detailQuery.isError || !boardItem || !board || !profile ? (
        <View style={styles.centerState}>
          <Image source={warningIcon} style={styles.warningIcon} contentFit="contain" />
          <Text style={styles.messageText}>피드를 불러오지 못했어요.</Text>
          <Pressable onPress={() => detailQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          enabled={keyboardVisible}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={detailQuery.isRefetching && !detailQuery.isFetchingNextPage}
                onRefresh={() => detailQuery.refetch()}
                tintColor={Magenta[300]}
                colors={[Magenta[300]]}
              />
            }
          >
            <FeedPostCard
              variant="detail"
              boardId={board.boardId}
              writerUserId={profile.userId}
              currentUserId={myUserId ?? undefined}
              profileImageUrl={profile.profileImageUrl}
              nickName={profile.nickName}
              role={profile.role}
              createdAt={board.lastCreatedTime}
              content={board.content}
              images={sortedImageUrls(boardItem.images)}
              works={boardItem.works}
              isSpoiler={board.isSpoiler ?? false}
              isAdultOnly={board.isAdultOnly ?? false}
              isBlinded={board.isBlinded}
              spoilerScript={board.spoilerScript}
              isLiked={effectivePostLike.isLiked}
              likeCount={effectivePostLike.likeCount}
              replyCount={board.replyCount + replyCountDelta}
              onToggleLike={onTogglePostLike}
              onClickWorksArrow={
                board.isWorksSelected && board.worksId
                  ? () => router.push(`/works/${board.worksId}` as const)
                  : undefined
              }
              onOpenReport={profile.userId !== myUserId ? onReportBoard : undefined}
              onOpenBlock={profile.userId !== myUserId ? onBlockBoard : undefined}
              onOpenDelete={profile.userId === myUserId ? () => setDeleteTarget({ type: 'post' }) : undefined}
              birthdayTheme={board.theme === 'BIRTHDAY'}
            />

            {replies.map((item) => {
              const replyId = item.reply.replyId
              const merged = withLike(item, replyLikeOverrides[replyId])
              const subReplies = [...(item.childReplies ?? []), ...(subRepliesMap[replyId] ?? [])]

              return (
                <View
                  key={replyId}
                  onLayout={(event) => {
                    commentLayoutYRef.current[replyId] = event.nativeEvent.layout.y
                  }}
                >
                  <FeedCommentItem
                    variant="reply"
                    myUserId={myUserId}
                    writerUserId={profile.userId}
                    item={merged}
                    isReplyTarget={replyTargetId === replyId}
                    subReplyCount={subReplies.length}
                    isMenuOpen={openMenuId === replyId}
                    onToggleMenu={() => toggleMenu(replyId)}
                    onToggleLike={() => onToggleReplyLike(replyId, likeOf(merged))}
                    onReplyTo={() => {
                      const next = replyTargetId === replyId ? null : replyId
                      setReplyTargetId(next)
                      if (next != null) commentInputRef.current?.focus()
                    }}
                    onOpenDelete={() => setDeleteTarget({ type: 'comment', replyId })}
                    onOpenReport={() => onReportReply(item)}
                    onOpenBlock={() => onBlockReply(item)}
                  />

                  {subReplies.map((subReply) => {
                    const subReplyId = subReply.reply.replyId
                    const mergedSub = withLike(subReply, replyLikeOverrides[subReplyId])

                    return (
                      <View
                        key={subReplyId}
                        onLayout={(event) => {
                          commentLayoutYRef.current[subReplyId] = event.nativeEvent.layout.y
                        }}
                      >
                        <FeedCommentItem
                          variant="subReply"
                          myUserId={myUserId}
                          writerUserId={profile.userId}
                          item={mergedSub}
                          isMenuOpen={openMenuId === subReplyId}
                          onToggleMenu={() => toggleMenu(subReplyId)}
                          onToggleLike={() => onToggleReplyLike(subReplyId, likeOf(mergedSub))}
                          onOpenDelete={() =>
                            setDeleteTarget({ type: 'comment', replyId: subReplyId, parentReplyId: replyId })
                          }
                          onOpenReport={() => onReportReply(subReply)}
                          onOpenBlock={() => onBlockReply(subReply)}
                        />
                      </View>
                    )
                  })}
                </View>
              )
            })}

            {detailQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color={Magenta[300]} style={styles.loader} />
            ) : null}
          </ScrollView>

          <FeedCommentInput
            ref={commentInputRef}
            profileImageUrl={me?.profileImageUrl}
            replyTargetActive={replyTargetId != null}
            value={commentText}
            onChangeText={setCommentText}
            onSubmit={onSubmitComment}
          />
        </KeyboardAvoidingView>
      )}
      {userActionModals}
      <FeedDeleteConfirmModal
        type={deleteTarget?.type ?? 'post'}
        visible={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTarget}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  topBarTitle: {
    ...Typography.body1Medium,
    color: Gray[900],
  },
  topBarSpacer: {
    width: 24,
    height: 24,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: C.card,
  },
  warningIcon: {
    width: 100,
    height: 100,
  },
  messageText: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: Radius.sm,
    backgroundColor: Magenta[300],
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: {
    ...Typography.body2Medium,
    color: C.card,
  },
  loader: {
    paddingVertical: 16,
  },
})
