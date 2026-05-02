import { useCallback, useState } from 'react'
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
import { useFavoriteWork } from '../../src/hooks/favorite/useFavoriteWork'
import {
  useLikeWorksReview,
  useWorksDetail,
  useWorksReviewsInfinite,
  WorksHero,
  ReviewCard,
  type WorksReviewItem,
} from '../../src/features/works'
import { useJoinTopicRoom, findTopicRoomIdByWorksName } from '../../src/features/topicroom'
import { C } from '../../src/theme/colors'

type EntryPhase = 'idle' | 'searching' | 'joining' | 'error'

export default function WorksDetailScreen() {
  const { worksId: worksIdParam } = useLocalSearchParams<{ worksId: string }>()
  const worksId = typeof worksIdParam === 'string' ? Number(worksIdParam) : 0
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // ── Data hooks ────────────────────────────────────────────────────────────
  const worksQuery = useWorksDetail(worksId)
  const works = worksQuery.data

  const { isFavorite, isMutating, toggleFavorite, isLoading: favLoading } =
    useFavoriteWork(worksId)

  const reviewsQuery = useWorksReviewsInfinite(worksId)
  const reviews: WorksReviewItem[] =
    reviewsQuery.data?.pages.flatMap((p) => p.content ?? []) ?? []

  const likeMutation = useLikeWorksReview({ worksId })
  const joinMutation = useJoinTopicRoom()

  // ── TopicRoom entry ───────────────────────────────────────────────────────
  const [entryPhase, setEntryPhase] = useState<EntryPhase>('idle')
  const [entryError, setEntryError] = useState<string | null>(null)

  const enterTopicRoom = useCallback(async () => {
    if (!works?.worksName) return
    setEntryPhase('searching')
    setEntryError(null)
    try {
      const roomId = await findTopicRoomIdByWorksName(works.worksName)
      if (!roomId) {
        setEntryPhase('error')
        setEntryError('이 작품의 토픽룸이 없습니다.')
        return
      }
      setEntryPhase('joining')
      await joinMutation.mutateAsync(roomId)
      router.push(`/topicroom/${roomId}`)
      setEntryPhase('idle')
    } catch {
      setEntryPhase('error')
      setEntryError('토픽룸 입장에 실패했습니다. 다시 시도해주세요.')
    }
  }, [works?.worksName, joinMutation, router])

  const isEntering = entryPhase === 'searching' || entryPhase === 'joining'

  // ── Full-screen loading / error ───────────────────────────────────────────
  if (worksQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '작품 상세' }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (worksQuery.isError || !works) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '작품 상세' }} />
        <Text style={styles.fullErrorText}>작품 정보를 불러오지 못했습니다.</Text>
      </View>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: works.worksName, headerBackTitle: '뒤로' }} />

      {/* ── Hero: thumbnail + title + meta ─────────────────────────────── */}
      <WorksHero works={works} />

      {/* ── Description ────────────────────────────────────────────────── */}
      {works.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>작품 소개</Text>
          <Text style={styles.description}>{works.description}</Text>
        </View>
      ) : null}

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <View style={styles.actionsSection}>
        {/* Favorite toggle */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            isFavorite ? styles.favBtnActive : styles.favBtnDefault,
            pressed && styles.btnPressed,
          ]}
          onPress={() => void toggleFavorite()}
          disabled={favLoading || isMutating}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          {favLoading || isMutating ? (
            <ActivityIndicator
              size="small"
              color={isFavorite ? C.primary : C.text}
            />
          ) : (
            <Text style={[styles.btnText, isFavorite && styles.favBtnActiveText]}>
              {isFavorite ? '♥ 즐겨찾기 해제' : '♡ 즐겨찾기 추가'}
            </Text>
          )}
        </Pressable>

        {/* TopicRoom entry */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.topicRoomBtn,
            (isEntering || pressed) && styles.btnPressed,
          ]}
          onPress={enterTopicRoom}
          disabled={isEntering}
          accessibilityRole="button"
        >
          {isEntering ? (
            <View style={styles.rowCenter}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.topicRoomBtnText}>
                {entryPhase === 'searching' ? '토픽룸 검색 중…' : '입장 중…'}
              </Text>
            </View>
          ) : (
            <Text style={styles.topicRoomBtnText}>💬 토픽룸 입장</Text>
          )}
        </Pressable>

        {/* Entry error inline */}
        {entryPhase === 'error' && entryError ? (
          <View style={styles.entryErrorBox}>
            <Text style={styles.entryErrorText}>{entryError}</Text>
            <Pressable onPress={() => setEntryPhase('idle')}>
              <Text style={styles.entryErrorDismiss}>닫기</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ── Reviews ────────────────────────────────────────────────────── */}
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsSectionTitle}>
          리뷰{works.reviewCount != null ? ` ${works.reviewCount}개` : ''}
        </Text>

        {/* Loading */}
        {reviewsQuery.isLoading ? (
          <ActivityIndicator
            size="small"
            color={C.primary}
            style={styles.reviewsLoader}
          />
        ) : null}

        {/* Error */}
        {!reviewsQuery.isLoading && reviewsQuery.isError ? (
          <Text style={styles.reviewsErrorText}>리뷰를 불러오지 못했습니다.</Text>
        ) : null}

        {/* Empty */}
        {!reviewsQuery.isLoading &&
          !reviewsQuery.isError &&
          reviews.length === 0 ? (
          <Text style={styles.reviewsEmptyText}>
            아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!
          </Text>
        ) : null}

        {/* Review cards */}
        {reviews.map((item) => (
          <ReviewCard
            key={String(item.reviewId)}
            item={item}
            onLike={(reviewId) => likeMutation.mutate(reviewId)}
            isLiking={
              likeMutation.isPending &&
              likeMutation.variables === item.reviewId
            }
          />
        ))}

        {/* Load more */}
        {reviewsQuery.hasNextPage ? (
          <Pressable
            style={({ pressed }) => [
              styles.loadMoreBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={() => void reviewsQuery.fetchNextPage()}
            disabled={reviewsQuery.isFetchingNextPage}
          >
            {reviewsQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Text style={styles.loadMoreText}>리뷰 더 보기</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BTN_RADIUS = 12

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: C.bg,
  },
  fullErrorText: { fontSize: 14, color: C.error },

  // Description section
  section: {
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
  },

  // Actions section
  actionsSection: {
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  btn: {
    borderRadius: BTN_RADIUS,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnText: { fontSize: 15, fontWeight: '600', color: C.text },
  btnPressed: { opacity: 0.7 },

  favBtnDefault: {
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  favBtnActive: {
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  favBtnActiveText: { color: C.primary },

  topicRoomBtn: { backgroundColor: C.primary },
  topicRoomBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  entryErrorBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryErrorText: { fontSize: 13, color: C.error, flex: 1 },
  entryErrorDismiss: { fontSize: 13, color: C.textMuted, marginLeft: 12 },

  // Reviews section
  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  reviewsSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 14,
  },
  reviewsLoader: { marginVertical: 12, alignSelf: 'flex-start' },
  reviewsErrorText: { fontSize: 13, color: C.error, paddingVertical: 8 },
  reviewsEmptyText: {
    fontSize: 13,
    color: C.textMuted,
    paddingVertical: 12,
    textAlign: 'center',
  },

  // Load more
  loadMoreBtn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: BTN_RADIUS,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 44,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: C.primary },
})
