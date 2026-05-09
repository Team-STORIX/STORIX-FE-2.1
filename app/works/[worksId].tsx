import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useFavoriteWork } from '../../src/features/favorite'
import { useMe } from '../../src/features/profile'
import {
  MyReviewSection,
  OtherReviewsSection,
  TopicRoomEntryButton,
  useLikeWorksReview,
  useWorksDetail,
  useWorksMyReview,
  useWorksReviewsInfinite,
  WorksCoverHeader,
  WorksInfoSection,
  WorksTopBar,
  type WorksReviewItem,
} from '../../src/features/works'
import {
  findTopicRoomIdByWorksName,
  TopicRoomCreateModal,
  useCreateTopicRoom,
  useJoinTopicRoom,
} from '../../src/features/topicroom'
import { Toast } from '../../src/components/common/Toast'
import { C } from '../../src/theme/colors'
import { Typography } from '../../src/theme/typography'

type EntryPhase = 'idle' | 'searching' | 'joining' | 'creating'
type TabKey = 'info' | 'review'

export default function WorksDetailScreen() {
  const { worksId: worksIdParam } = useLocalSearchParams<{ worksId: string }>()
  const worksId = typeof worksIdParam === 'string' ? Number(worksIdParam) : 0
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('info')

  const worksQuery = useWorksDetail(worksId)
  const works = worksQuery.data

  const { data: meData } = useMe()
  const myNickname = meData?.nickName

  const { isFavorite, isMutating, toggleFavorite, isLoading: favoriteLoading } =
    useFavoriteWork(worksId)

  const myReviewQuery = useWorksMyReview(worksId)
  const myReview = myReviewQuery.data ?? null

  const reviewsQuery = useWorksReviewsInfinite(worksId)
  const reviews: WorksReviewItem[] =
    reviewsQuery.data?.pages.flatMap((page) => page.content ?? []) ?? []

  const likeMutation = useLikeWorksReview({ worksId })
  const joinMutation = useJoinTopicRoom()
  const createMutation = useCreateTopicRoom()

  const [entryPhase, setEntryPhase] = useState<EntryPhase>('idle')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isEntering =
    entryPhase === 'searching' ||
    entryPhase === 'joining' ||
    entryPhase === 'creating'

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 2400)
  }, [])

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    },
    [],
  )

  const navigateToRoom = useCallback(
    (roomId: number) => {
      setEntryPhase('idle')
      setCreateModalOpen(false)
      router.push(`/topicroom/${roomId}` as const)
    },
    [router],
  )

  const enterTopicRoom = useCallback(async () => {
    if (!works?.worksName || isEntering) return

    setEntryPhase('searching')

    try {
      const roomId = await findTopicRoomIdByWorksName(works.worksName)
      if (!roomId) {
        // No existing room — open the create flow instead of inline error.
        setEntryPhase('idle')
        setCreateModalOpen(true)
        return
      }

      setEntryPhase('joining')
      await joinMutation.mutateAsync(roomId)
      navigateToRoom(roomId)
    } catch {
      setEntryPhase('idle')
      showToast('토픽룸 입장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [isEntering, joinMutation, navigateToRoom, showToast, works?.worksName])

  const handleCreate = useCallback(
    async (topicRoomName: string) => {
      if (!worksId || createMutation.isPending) return

      setEntryPhase('creating')
      try {
        const newRoomId = await createMutation.mutateAsync({
          worksId,
          topicRoomName,
        })
        try {
          await joinMutation.mutateAsync(newRoomId)
        } catch {
          // Creator is auto-joined server-side in most setups; ignore join failures here.
        }
        navigateToRoom(newRoomId)
      } catch {
        setEntryPhase('idle')
        showToast('토픽룸 생성에 실패했어요. 잠시 후 다시 시도해 주세요.')
      }
    },
    [createMutation, joinMutation, navigateToRoom, showToast, worksId],
  )

  const backToPrevious = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)' as const)
  }, [router])

  const goReviewWrite = useCallback(() => {
    if (!worksId) return
    router.push(`/review/write?worksId=${worksId}` as never)
  }, [router, worksId])

  const goReviewDetail = useCallback(
    (reviewId: number) => {
      router.push(`/works/review/${reviewId}` as never)
    },
    [router],
  )

  const handleLikeReview = useCallback(
    (reviewId: number) => {
      if (likeMutation.isPending) return
      likeMutation.mutate(reviewId)
    },
    [likeMutation],
  )

  const reviewTabLabel = useMemo(() => {
    const count = works?.reviewCount ?? reviews.length
    return `리뷰(${count})`
  }, [reviews.length, works?.reviewCount])

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <WorksTopBar
        topInset={insets.top}
        isFavorite={isFavorite}
        isBusy={favoriteLoading || isMutating}
        onBack={backToPrevious}
        onToggleFavorite={() => void toggleFavorite()}
      />

      {worksQuery.isLoading ? (
        <CenteredState text="작품 정보를 불러오는 중이에요.">
          <ActivityIndicator size="large" color={C.primary} />
        </CenteredState>
      ) : worksQuery.isError || !works ? (
        <CenteredState text="작품 정보를 불러오지 못했어요." />
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + 116 }}
            showsVerticalScrollIndicator={false}
          >
            <WorksCoverHeader works={works} />

            <View style={styles.tabBar}>
              <TabButton
                label="정보"
                active={tab === 'info'}
                onPress={() => setTab('info')}
              />
              <TabButton
                label={reviewTabLabel}
                active={tab === 'review'}
                onPress={() => setTab('review')}
              />
            </View>

            {tab === 'info' ? (
              <WorksInfoSection works={works} />
            ) : (
              <View>
                <MyReviewSection
                  myReview={myReview}
                  userName={myNickname}
                  onPressWrite={goReviewWrite}
                  onPressDetail={goReviewDetail}
                />

                <OtherReviewsSection
                  reviews={reviews}
                  isLoading={reviewsQuery.isLoading}
                  isError={reviewsQuery.isError}
                  hasNextPage={reviewsQuery.hasNextPage}
                  isFetchingNextPage={reviewsQuery.isFetchingNextPage}
                  onFetchNextPage={() => void reviewsQuery.fetchNextPage()}
                  onPressDetail={goReviewDetail}
                  onPressLike={handleLikeReview}
                  likingReviewId={
                    likeMutation.isPending && typeof likeMutation.variables === 'number'
                      ? likeMutation.variables
                      : null
                  }
                />
              </View>
            )}
          </ScrollView>

          <TopicRoomEntryButton
            bottomInset={insets.bottom}
            hasTopicRoom={works.hasTopicRoom ?? false}
            isCheckingRoom={isEntering}
            onPress={() => void enterTopicRoom()}
          />
        </>
      )}

      <TopicRoomCreateModal
        visible={createModalOpen}
        isSubmitting={entryPhase === 'creating' || createMutation.isPending}
        onClose={() => {
          if (entryPhase === 'creating' || createMutation.isPending) return
          setCreateModalOpen(false)
        }}
        onConfirm={(topicRoomName) => {
          void handleCreate(topicRoomName)
        }}
      />

      <Toast message={toastMessage} bottomOffset={insets.bottom + 96} />
    </View>
  )
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    </Pressable>
  )
}

function CenteredState({
  children,
  text,
}: {
  children?: ReactNode
  text: string
}) {
  return (
    <View style={styles.centeredState}>
      {children}
      <Text style={styles.centeredText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.card,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: C.card,
  },
  centeredText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    backgroundColor: C.card,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 14,
  },
  tabLabel: {
    ...Typography.body1Semibold,
    color: C.textMuted,
    marginBottom: 10,
  },
  tabLabelActive: {
    color: C.text,
  },
  tabUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: C.primary,
  },
  pressed: {
    opacity: 0.7,
  },
})
