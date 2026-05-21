import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { Gray, Magenta } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { Typography } from '../../../theme/typography'
import { useMe } from '../../profile'
import { reportReply } from '../api/feed/readerReply.api'
import {
  createReply,
  createSubReply,
  deleteReply,
  toggleReplyLike,
  type ReplyItem,
} from '../api/feed/readerBoardDetail.api'
import { deleteBoard, reportBoard, toggleBoardLike } from '../api/feed/readerBoard.api'
import { useBoardDetailInfinite } from '../hooks/feed/useBoardDetailInfinite'
import { FeedCommentInput, type FeedCommentInputHandle } from './FeedCommentInput'
import { FeedCommentItem } from './FeedCommentItem'
import { FeedPostCard } from './FeedPostCard'
import { ReportModal } from './ReportModal'

const backIcon = require('../../../../assets/icons/common/back.svg')
const warningIcon = require('../../../../assets/icons/profile/warning.svg')

function parseBoardId(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

export function FeedDetailScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const qc = useQueryClient()
  const params = useLocalSearchParams<{ boardId?: string }>()
  const boardId = parseBoardId(params.boardId)
  const scrollRef = useRef<ScrollView | null>(null)
  const commentInputRef = useRef<FeedCommentInputHandle>(null)

  const { data: me } = useMe()
  const myUserId = me?.userId ?? null
  const detailQuery = useBoardDetailInfinite(boardId ?? 0)

  const firstPage = detailQuery.data?.pages[0]
  const boardItem = firstPage?.board
  const replies = useMemo(
    () => detailQuery.data?.pages.flatMap((page) => page.comment.content) ?? [],
    [detailQuery.data?.pages],
  )

  const [commentText, setCommentText] = useState('')
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const [subRepliesMap, setSubRepliesMap] = useState<Record<number, ReplyItem[]>>({})
  const [postLikeOverride, setPostLikeOverride] = useState<{
    isLiked: boolean
    likeCount: number
  } | null>(null)
  const [replyLikeOverrides, setReplyLikeOverrides] = useState<
    Record<number, { isLiked: boolean; likeCount: number }>
  >({})
  const [subReplyLikeOverrides, setSubReplyLikeOverrides] = useState<
    Record<number, Record<number, { isLiked: boolean; likeCount: number }>>
  >({})
  const [openReplyMenuId, setOpenReplyMenuId] = useState<number | null>(null)
  const [openSubReplyMenuId, setOpenSubReplyMenuId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [replyCountDelta, setReplyCountDelta] = useState(0)
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible())
  const [reportTarget, setReportTarget] = useState<{
    profileImageUrl?: string | null
    nickname: string
    onConfirm: () => Promise<void>
  } | null>(null)

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true)
    })
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const board = boardItem?.board
  const profile = boardItem?.profile
  const works = boardItem?.works
  const images = (boardItem?.images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.imageUrl)

  const effectivePostLike = postLikeOverride ?? {
    isLiked: board?.isLiked ?? false,
    likeCount: board?.likeCount ?? 0,
  }

  const onTogglePostLike = useCallback(async () => {
    if (!boardId || !board) return
    const optimistic = {
      isLiked: !effectivePostLike.isLiked,
      likeCount: Math.max(
        0,
        effectivePostLike.likeCount + (effectivePostLike.isLiked ? -1 : 1),
      ),
    }
    setPostLikeOverride(optimistic)
    try {
      const result = await toggleBoardLike(boardId)
      setPostLikeOverride(result)
    } catch {
      setPostLikeOverride({ isLiked: board.isLiked, likeCount: board.likeCount })
    }
  }, [board, boardId, effectivePostLike])

  const onToggleReplyLike = useCallback(
    async (replyId: number, current: { isLiked: boolean; likeCount: number }) => {
      const optimistic = {
        isLiked: !current.isLiked,
        likeCount: Math.max(0, current.likeCount + (current.isLiked ? -1 : 1)),
      }
      setReplyLikeOverrides((prev) => ({ ...prev, [replyId]: optimistic }))
      try {
        const result = await toggleReplyLike({ boardId: boardId as number, replyId })
        setReplyLikeOverrides((prev) => ({ ...prev, [replyId]: result }))
      } catch {
        setReplyLikeOverrides((prev) => ({ ...prev, [replyId]: current }))
      }
    },
    [boardId],
  )

  const onToggleSubReplyLike = useCallback(
    async (
      parentReplyId: number,
      replyId: number,
      current: { isLiked: boolean; likeCount: number },
    ) => {
      const optimistic = {
        isLiked: !current.isLiked,
        likeCount: Math.max(0, current.likeCount + (current.isLiked ? -1 : 1)),
      }
      setSubReplyLikeOverrides((prev) => ({
        ...prev,
        [parentReplyId]: { ...(prev[parentReplyId] ?? {}), [replyId]: optimistic },
      }))
      try {
        const result = await toggleReplyLike({ boardId: boardId as number, replyId })
        setSubReplyLikeOverrides((prev) => ({
          ...prev,
          [parentReplyId]: { ...(prev[parentReplyId] ?? {}), [replyId]: result },
        }))
      } catch {
        setSubReplyLikeOverrides((prev) => ({
          ...prev,
          [parentReplyId]: { ...(prev[parentReplyId] ?? {}), [replyId]: current },
        }))
      }
    },
    [boardId],
  )

  const onDeleteBoard = useCallback(() => {
    if (!boardId) return
    Alert.alert('삭제', '이 게시글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBoard(boardId)
            await qc.invalidateQueries({ queryKey: ['feed', 'boards'] })
            router.back()
          } catch {
            Alert.alert('오류', '삭제에 실패했어요.')
          }
        },
      },
    ])
  }, [boardId, qc, router])

  const onReportBoard = useCallback(() => {
    if (!boardId || !profile) return
    setReportTarget({
      profileImageUrl: profile.profileImageUrl,
      nickname: profile.nickName,
      onConfirm: async () => {
        const result = await reportBoard({ boardId, reportedUserId: profile.userId })
        if (result.status === 'duplicated') {
          throw new Error('이미 신고한 유저예요.')
        }
      },
    })
  }, [boardId, profile])

  const onDeleteReply = useCallback(
    (replyId: number, parentReplyId?: number) => {
      if (!boardId) return
      Alert.alert('삭제', '이 댓글을 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReply({ boardId, replyId })
              if (parentReplyId != null) {
                setSubRepliesMap((prev) => ({
                  ...prev,
                  [parentReplyId]: (prev[parentReplyId] ?? []).filter(
                    (item) => item.reply.replyId !== replyId,
                  ),
                }))
              }
              await detailQuery.refetch()
            } catch {
              Alert.alert('오류', '삭제에 실패했어요.')
            }
          },
        },
      ])
    },
    [boardId, detailQuery],
  )

  const onReportReply = useCallback(
    (
      replyId: number,
      reportedUserId: number,
      authorProfile: { profileImageUrl?: string | null; nickName: string },
    ) => {
      if (!boardId) return
      setReportTarget({
        profileImageUrl: authorProfile.profileImageUrl,
        nickname: authorProfile.nickName,
        onConfirm: async () => {
          await reportReply({ boardId, replyId, reportedUserId })
        },
      })
    },
    [boardId],
  )

  const onSubmitComment = useCallback(async () => {
    const trimmed = commentText.trim()
    if (!trimmed || !boardId || submitting) return
    setSubmitting(true)

    if (replyTargetId != null) {
      // 대댓글: UI를 먼저 업데이트(true optimistic)하고 API 호출 → 실패 시 rollback
      const targetId = replyTargetId
      const tempId = Date.now()
      const newSubReply: ReplyItem = {
        profile: {
          userId: me?.userId ?? 0,
          profileImageUrl: me?.profileImageUrl ?? null,
          nickName: me?.nickName ?? '',
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
      setSubRepliesMap((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] ?? []), newSubReply],
      }))
      setReplyCountDelta((prev) => prev + 1)
      setReplyTargetId(null)
      setCommentText('')
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
      setSubmitting(false)

      try {
        await createSubReply({ boardId, replyId: targetId, comment: trimmed })
        await detailQuery.refetch()
        setSubRepliesMap((prev) => {
          const next = { ...prev }
          delete next[targetId]
          return next
        })
        setReplyCountDelta(0)
        await qc.invalidateQueries({ queryKey: ['feed', 'boards'] })
      } catch {
        setSubRepliesMap((prev) => ({
          ...prev,
          [targetId]: (prev[targetId] ?? []).filter((r) => r.reply.replyId !== tempId),
        }))
        setReplyCountDelta((prev) => Math.max(0, prev - 1))
        Alert.alert('오류', '대댓글 등록에 실패했어요. 다시 시도해 주세요.')
      }
      return
    }

    try {
      await createReply({ boardId, comment: trimmed })
      await detailQuery.refetch()
      setReplyCountDelta(0)
      await qc.invalidateQueries({ queryKey: ['feed', 'boards'] })
      setCommentText('')
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
    } catch {
      Alert.alert('오류', '댓글 등록에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }, [boardId, commentText, detailQuery, me, replyTargetId, submitting])

  const onScroll = useCallback(
    (event: any) => {
      if (!detailQuery.hasNextPage || detailQuery.isFetchingNextPage) return
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
        void detailQuery.fetchNextPage()
      }
    },
    [detailQuery],
  )

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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>
        <Text style={styles.topBarTitle}>피드</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {detailQuery.isLoading ? (
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
                createdAt={board.lastCreatedTime}
                content={board.content}
                images={images}
                works={
                  works
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
                isLiked={effectivePostLike.isLiked}
                likeCount={effectivePostLike.likeCount}
                replyCount={board.replyCount + replyCountDelta}
                onToggleLike={onTogglePostLike}
                onClickWorksArrow={
                  board.isWorksSelected && board.worksId ? () => router.push(`/works/${board.worksId}` as const) : undefined
                }
                onOpenReport={profile.userId !== myUserId ? onReportBoard : undefined}
                onOpenDelete={profile.userId === myUserId ? onDeleteBoard : undefined}
                birthdayTheme={board.theme === 'BIRTHDAY'}
              />

              {replies.map((item) => {
                const override = replyLikeOverrides[item.reply.replyId]
                const merged = override ? { ...item, reply: { ...item.reply, ...override } } : item

                return (
                  <View key={item.reply.replyId}>
                    <FeedCommentItem
                      variant="reply"
                      myUserId={myUserId}
                      writerUserId={profile.userId}
                      item={merged}
                      isReplyTarget={replyTargetId === item.reply.replyId}
                      subReplyCount={(item.childReplies ?? []).length + (subRepliesMap[item.reply.replyId] ?? []).length}
                      isMenuOpen={openReplyMenuId === item.reply.replyId}
                      onToggleMenu={() =>
                        setOpenReplyMenuId((prev) =>
                          prev === item.reply.replyId ? null : item.reply.replyId,
                        )
                      }
                      onToggleLike={() =>
                        onToggleReplyLike(item.reply.replyId, {
                          isLiked: merged.reply.isLiked,
                          likeCount: merged.reply.likeCount,
                        })
                      }
                      onReplyTo={() => {
                        const next = replyTargetId === item.reply.replyId ? null : item.reply.replyId
                        setReplyTargetId(next)
                        if (next != null) {
                          commentInputRef.current?.focus()
                        }
                      }}
                      onOpenDelete={() => onDeleteReply(item.reply.replyId)}
                      onOpenReport={() => onReportReply(item.reply.replyId, item.reply.userId, item.profile)}
                    />

                    {[...(item.childReplies ?? []), ...(subRepliesMap[item.reply.replyId] ?? [])].map((subReply) => {
                      const subOverride =
                        subReplyLikeOverrides[item.reply.replyId]?.[subReply.reply.replyId]
                      const mergedSub = subOverride
                        ? { ...subReply, reply: { ...subReply.reply, ...subOverride } }
                        : subReply

                      return (
                        <FeedCommentItem
                          key={subReply.reply.replyId}
                          variant="subReply"
                          myUserId={myUserId}
                          writerUserId={profile.userId}
                          item={mergedSub}
                          isMenuOpen={openSubReplyMenuId === subReply.reply.replyId}
                          onToggleMenu={() =>
                            setOpenSubReplyMenuId((prev) =>
                              prev === subReply.reply.replyId ? null : subReply.reply.replyId,
                            )
                          }
                          onToggleLike={() =>
                            onToggleSubReplyLike(item.reply.replyId, subReply.reply.replyId, {
                              isLiked: mergedSub.reply.isLiked,
                              likeCount: mergedSub.reply.likeCount,
                            })
                          }
                          onOpenDelete={() =>
                            onDeleteReply(subReply.reply.replyId, item.reply.replyId)
                          }
                          onOpenReport={() =>
                            onReportReply(subReply.reply.replyId, subReply.reply.userId, subReply.profile)
                          }
                        />
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
      <ReportModal
        visible={reportTarget != null}
        profileImageUrl={reportTarget?.profileImageUrl}
        nickname={reportTarget?.nickname ?? ''}
        onClose={() => setReportTarget(null)}
        onConfirm={reportTarget?.onConfirm ?? (() => Promise.resolve())}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
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
    color: '#ffffff',
  },
  loader: {
    paddingVertical: 16,
  },
})
