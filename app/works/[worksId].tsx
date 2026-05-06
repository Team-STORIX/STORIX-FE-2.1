import { useCallback, useMemo, useState, type ReactNode } from 'react'
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
  useJoinTopicRoom,
} from '../../src/features/topicroom'
import { C } from '../../src/theme/colors'
import { Radius } from '../../src/theme/radius'
import { S } from '../../src/theme/spacing'
import { Typography } from '../../src/theme/typography'

type EntryPhase = 'idle' | 'searching' | 'joining' | 'error'
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

  const [entryPhase, setEntryPhase] = useState<EntryPhase>('idle')
  const [entryError, setEntryError] = useState<string | null>(null)

  const isEntering = entryPhase === 'searching' || entryPhase === 'joining'

  const enterTopicRoom = useCallback(async () => {
    if (!works?.worksName) return

    setEntryPhase('searching')
    setEntryError(null)

    try {
      const roomId = await findTopicRoomIdByWorksName(works.worksName)
      if (!roomId) {
        setEntryPhase('error')
        setEntryError('이 작품의 토픽룸이 아직 없어요.')
        return
      }

      setEntryPhase('joining')
      await joinMutation.mutateAsync(roomId)
      router.push(`/topicroom/${roomId}` as const)
      setEntryPhase('idle')
    } catch {
      setEntryPhase('error')
      setEntryError('토픽룸 입장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [joinMutation, router, works?.worksName])

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

            {entryPhase === 'error' && entryError ? (
              <View style={styles.entryErrorBox}>
                <Text style={styles.entryErrorText}>{entryError}</Text>
                <Pressable onPress={() => setEntryPhase('idle')}>
                  <Text style={styles.entryErrorDismiss}>닫기</Text>
                </Pressable>
              </View>
            ) : null}

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
  entryErrorBox: {
    marginHorizontal: S.screenH,
    marginTop: 16,
    borderRadius: Radius.md,
    backgroundColor: '#FFF3F3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryErrorText: {
    ...Typography.body2Medium,
    color: C.error,
    flex: 1,
  },
  entryErrorDismiss: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginLeft: 12,
  },
  pressed: {
    opacity: 0.7,
  },
})
