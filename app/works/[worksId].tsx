import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useFavoriteWork } from '../../src/features/favorite'
import {
  PostCard,
  TopicRoomEntryButton,
  useLikeWorksReview,
  useWorksDetail,
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

const arrowForward = require('../../assets/icons/common/icon-arrow-forward.svg')

export default function WorksDetailScreen() {
  const { worksId: worksIdParam } = useLocalSearchParams<{ worksId: string }>()
  const worksId = typeof worksIdParam === 'string' ? Number(worksIdParam) : 0
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('info')

  const worksQuery = useWorksDetail(worksId)
  const works = worksQuery.data

  const { isFavorite, isMutating, toggleFavorite, isLoading: favoriteLoading } =
    useFavoriteWork(worksId)

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
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>다른 유저들의 리뷰</Text>

                {reviewsQuery.isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={C.primary}
                    style={styles.reviewLoader}
                  />
                ) : null}

                {!reviewsQuery.isLoading && reviewsQuery.isError ? (
                  <Text style={styles.messageText}>리뷰를 불러오지 못했어요.</Text>
                ) : null}

                {!reviewsQuery.isLoading &&
                !reviewsQuery.isError &&
                reviews.length === 0 ? (
                  <View style={styles.emptyReviewCard}>
                    <Text style={styles.emptyReviewTitle}>아직 리뷰가 없어요.</Text>
                    <Text style={styles.emptyReviewBody}>
                      첫 번째 감상을 남길 차례예요.
                    </Text>
                  </View>
                ) : null}

                {reviews.map((item) => (
                  <PostCard
                    key={String(item.reviewId)}
                    item={item}
                    onLike={(reviewId) => likeMutation.mutate(reviewId)}
                    isLiking={
                      likeMutation.isPending &&
                      likeMutation.variables === item.reviewId
                    }
                  />
                ))}

                {reviewsQuery.hasNextPage ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.loadMoreButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => void reviewsQuery.fetchNextPage()}
                    disabled={reviewsQuery.isFetchingNextPage}
                  >
                    {reviewsQuery.isFetchingNextPage ? (
                      <ActivityIndicator size="small" color={C.primary} />
                    ) : (
                      <>
                        <Text style={styles.loadMoreText}>리뷰 더보기</Text>
                        <Image
                          source={arrowForward}
                          style={styles.loadMoreIcon}
                          contentFit="contain"
                        />
                      </>
                    )}
                  </Pressable>
                ) : null}
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
  reviewSection: {
    paddingHorizontal: S.screenH,
    paddingTop: 24,
  },
  reviewSectionTitle: {
    ...Typography.heading2,
    color: C.text,
    marginBottom: 8,
  },
  reviewLoader: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  messageText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginTop: 12,
  },
  emptyReviewCard: {
    borderRadius: Radius.md,
    backgroundColor: C.bg,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyReviewTitle: {
    ...Typography.body1Semibold,
    color: C.textSecondary,
  },
  emptyReviewBody: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginTop: 4,
  },
  loadMoreButton: {
    marginTop: 16,
    marginBottom: 8,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadMoreText: {
    ...Typography.body2Bold,
    color: C.primary,
  },
  loadMoreIcon: {
    width: 16,
    height: 16,
    tintColor: C.primary,
  },
  pressed: {
    opacity: 0.7,
  },
})
