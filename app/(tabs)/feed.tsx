import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useAllBoards } from '../../src/features/feed/hooks/feed/useAllBoards'
import { C } from '../../src/theme/colors'
import type { FeedBoardItem } from '../../src/features/feed/api/feed/readerBoard.api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useAllBoards()

  const items: FeedBoardItem[] = data?.pages.flatMap((p) => p.content) ?? []

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const goToWorks = useCallback(
    (worksId: number) => router.push(`/works/${worksId}`),
    [router],
  )

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>피드를 불러오지 못했습니다.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16 },
        items.length === 0 && styles.emptyGrow,
      ]}
      data={items}
      keyExtractor={(item) => `board_${item.board.boardId}`}
      renderItem={({ item }) => (
        <FeedCard item={item} onWorksTap={goToWorks} />
      )}
      ListHeaderComponent={<Text style={styles.screenTitle}>피드</Text>}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>등록된 피드가 없습니다.</Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator
            size="small"
            color={C.primary}
            style={styles.paginationLoader}
          />
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={C.primary}
          colors={[C.primary]}
        />
      }
    />
  )
}

// ─── Feed card ────────────────────────────────────────────────────────────────

function FeedCard({
  item,
  onWorksTap,
}: {
  item: FeedBoardItem
  onWorksTap: (worksId: number) => void
}) {
  const { profile, board, works } = item
  const isSpoiler = board.isSpoiler ?? false
  const initial = (profile.nickName ?? '?')[0].toUpperCase()

  const worksId =
    board.isWorksSelected && board.worksId != null && board.worksId > 0
      ? board.worksId
      : null

  const handlePress = worksId !== null ? () => onWorksTap(worksId) : undefined

  const cardContent = (
    <>
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          {profile.profileImageUrl ? (
            <Image
              source={{ uri: profile.profileImageUrl }}
              style={styles.avatarImg}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{profile.nickName}</Text>
          <Text style={styles.timeText}>{timeAgo(board.lastCreatedTime)}</Text>
        </View>
        {board.isLiked && <Text style={styles.likedHeart}>♥</Text>}
      </View>

      {/* Content or spoiler placeholder */}
      {isSpoiler ? (
        <View style={styles.spoilerBox}>
          <Text style={styles.spoilerLabel}>스포일러 포함</Text>
          <Text style={styles.spoilerHint}>
            {worksId != null ? '탭하여 작품 페이지에서 확인' : '스포일러 글'}
          </Text>
        </View>
      ) : (
        <Text style={styles.contentText} numberOfLines={3}>
          {board.content}
        </Text>
      )}

      {/* Works info strip */}
      {works != null && (
        <View style={styles.worksRow}>
          <View style={styles.worksThumbnail}>
            {works.thumbnailUrl ? (
              <Image
                source={{ uri: works.thumbnailUrl }}
                style={styles.worksThumbnailImg}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.worksThumbnailFallback}>
                {(works.worksName ?? '?')[0]}
              </Text>
            )}
          </View>
          <View style={styles.worksMeta}>
            <Text style={styles.worksName} numberOfLines={1}>
              {works.worksName}
            </Text>
            <Text style={styles.worksArtist} numberOfLines={1}>
              {works.artistName}
            </Text>
          </View>
          {worksId != null && (
            <Text style={styles.worksChevron}>›</Text>
          )}
        </View>
      )}

      {/* Footer: like / reply counts */}
      <View style={styles.cardFooter}>
        <View style={styles.counts}>
          <Text
            style={[styles.countText, board.isLiked && styles.countLiked]}
          >
            ♡ {board.likeCount}
          </Text>
          <Text style={styles.countText}>💬 {board.replyCount}</Text>
        </View>
        {handlePress != null && (
          <Text style={styles.cardChevron}>›</Text>
        )}
      </View>
    </>
  )

  if (handlePress != null) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${profile.nickName}의 피드`}
      >
        {cardContent}
      </Pressable>
    )
  }

  return <View style={styles.card}>{cardContent}</View>
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 36
const CARD_RADIUS = 12

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  emptyGrow: { flex: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  errorText: { fontSize: 14, color: C.error, marginBottom: 12 },
  retryBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: CARD_RADIUS,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardPressed: { opacity: 0.72 },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarInitial: { fontSize: 14, fontWeight: '700', color: C.primary },
  authorMeta: { flex: 1 },
  authorName: { fontSize: 13, fontWeight: '600', color: C.text },
  timeText: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  likedHeart: { fontSize: 14, color: C.liked },

  // Content
  contentText: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },

  // Spoiler
  spoilerBox: {
    backgroundColor: C.spoilerBg,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  spoilerLabel: { fontSize: 13, fontWeight: '600', color: C.primary },
  spoilerHint: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // Works strip
  worksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.divider,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    gap: 8,
  },
  worksThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: C.primaryLight,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  worksThumbnailImg: { width: 40, height: 40 },
  worksThumbnailFallback: {
    fontSize: 18,
    fontWeight: '700',
    color: C.primary,
  },
  worksMeta: { flex: 1 },
  worksName: { fontSize: 13, fontWeight: '600', color: C.text },
  worksArtist: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  worksChevron: { fontSize: 16, color: C.textMuted },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counts: { flexDirection: 'row', gap: 12 },
  countText: { fontSize: 12, color: C.textMuted },
  countLiked: { color: C.liked },
  cardChevron: { fontSize: 18, color: C.textMuted },

  paginationLoader: { paddingVertical: 16 },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 48, flex: 1 },
  emptyText: { fontSize: 14, color: C.textMuted },
})
