import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMe } from '../../src/hooks/profile/useMe'
import { useTodayHomeFeeds } from '../../src/hooks/homeFeed/useTodayHomeFeeds'
import { useTodayTopicRooms } from '../../src/hooks/topicroom/useTodayTopicRooms'
import { usePopularTopicRooms } from '../../src/hooks/topicroom/usePopularTopicRooms'
import { formatTopicRoomSubtitle } from '../../src/lib/api/topicroom'
import { C } from '../../src/theme/colors'
import type { TodayFeedItem } from '../../src/lib/api/homeFeed/homeFeed.schema'
import type { TopicRoomItem } from '../../src/lib/api/topicroom/topicroom.schema'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { data: me, isLoading: meLoading } = useMe()
  const {
    data: feeds,
    isLoading: feedsLoading,
    isError: feedsError,
  } = useTodayHomeFeeds()
  const {
    data: todayRooms,
    isLoading: todayLoading,
    isError: todayError,
  } = useTodayTopicRooms()
  const {
    data: popularRooms,
    isLoading: popularLoading,
    isError: popularError,
  } = usePopularTopicRooms()

  const goToRoom = (roomId: number) => router.push(`/topicroom/${roomId}`)

  const goToWorks = (worksId: number) => router.push(`/works/${worksId}`)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.logoText}>STORIX</Text>
        {meLoading ? (
          <ActivityIndicator size="small" color={C.primary} />
        ) : (
          <Text style={styles.greeting}>
            {me ? `안녕하세요, ${me.nickName}님` : ''}
          </Text>
        )}
      </View>

      {/* ── Today Feeds ────────────────────────────────────────────────── */}
      <Section title="오늘의 피드" loading={feedsLoading} error={feedsError}>
        {feeds?.length === 0 && <EmptyNote text="오늘의 피드가 없습니다." />}
        {feeds?.map((item) => {
          const worksId =
            item.board.isWorksSelected === true &&
            item.board.worksId != null &&
            item.board.worksId > 0
              ? item.board.worksId
              : null
          return (
            <FeedCard
              key={`feed_${item.board.boardId}`}
              item={item}
              onPress={worksId !== null ? () => goToWorks(worksId) : undefined}
            />
          )
        })}
      </Section>

      {/* ── Today TopicRooms ───────────────────────────────────────────── */}
      <Section
        title="오늘의 토픽룸"
        loading={todayLoading}
        error={todayError}
      >
        {todayRooms?.length === 0 && (
          <EmptyNote text="오늘의 토픽룸이 없습니다." />
        )}
        {todayRooms?.map((room) => (
          <TopicRoomRow
            key={`today_${room.topicRoomId}`}
            room={room}
            onPress={() => goToRoom(room.topicRoomId)}
          />
        ))}
      </Section>

      {/* ── Popular TopicRooms (horizontal scroll) ─────────────────────── */}
      <Section
        title="지금 핫한 토픽룸"
        loading={popularLoading}
        error={popularError}
        noPad
      >
        {popularRooms?.length === 0 && (
          <EmptyNote text="인기 토픽룸이 없습니다." style={styles.popularEmpty} />
        )}
        {popularRooms && popularRooms.length > 0 && (
          <FlatList
            data={popularRooms}
            keyExtractor={(r) => `popular_${r.topicRoomId}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
            renderItem={({ item }) => (
              <TopicRoomCard
                room={item}
                onPress={() => goToRoom(item.topicRoomId)}
              />
            )}
          />
        )}
      </Section>
    </ScrollView>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  title,
  loading,
  error,
  noPad = false,
  children,
}: {
  title: string
  loading: boolean
  error: boolean
  noPad?: boolean
  children: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, noPad && styles.sectionTitlePadded]}>
        {title}
      </Text>
      {loading && (
        <ActivityIndicator
          size="small"
          color={C.primary}
          style={styles.sectionLoader}
        />
      )}
      {!loading && error && (
        <Text style={[styles.errorText, !noPad && styles.errorTextPad]}>
          데이터를 불러오지 못했습니다.
        </Text>
      )}
      {!loading && !error && children}
    </View>
  )
}

// ─── Feed card ────────────────────────────────────────────────────────────────

function FeedCard({
  item,
  onPress,
}: {
  item: TodayFeedItem
  onPress?: () => void
}) {
  const { profile, board } = item
  const isSpoiler = board.isSpoiler

  const initial = (profile.nickName ?? '?')[0].toUpperCase()

  const cardContent = (
    <>
      {/* Author row */}
      <View style={styles.feedAuthorRow}>
        <View style={styles.feedAvatar}>
          {profile.profileImageUrl ? (
            <Image
              source={{ uri: profile.profileImageUrl }}
              style={styles.feedAvatarImg}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.feedAvatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.feedAuthorMeta}>
          <Text style={styles.feedAuthorName}>{profile.nickName}</Text>
          {board.lastCreatedTime != null && (
            <Text style={styles.feedTime}>{timeAgo(board.lastCreatedTime)}</Text>
          )}
        </View>
        {board.isLiked && <Text style={styles.feedLikedBadge}>♥</Text>}
      </View>

      {/* Content */}
      {isSpoiler ? (
        <View style={styles.spoilerBox}>
          <Text style={styles.spoilerLabel}>스포일러 포함</Text>
          <Text style={styles.spoilerHint}>탭하여 작품 페이지에서 확인</Text>
        </View>
      ) : (
        <Text style={styles.feedContent} numberOfLines={3}>
          {board.content}
        </Text>
      )}

      {/* Counts + chevron */}
      <View style={styles.feedFooter}>
        <View style={styles.feedCounts}>
          <Text style={styles.feedCountText}>♡ {board.likeCount}</Text>
          <Text style={styles.feedCountText}>💬 {board.replyCount}</Text>
        </View>
        {onPress && <Text style={styles.feedChevron}>›</Text>}
      </View>
    </>
  )

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.feedCard,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {cardContent}
      </Pressable>
    )
  }

  return <View style={styles.feedCard}>{cardContent}</View>
}

// ─── Topic room row (vertical list) ──────────────────────────────────────────

function TopicRoomRow({
  room,
  onPress,
}: {
  room: TopicRoomItem
  onPress: () => void
}) {
  const subtitle = formatTopicRoomSubtitle(room.worksType, room.worksName)
  return (
    <Pressable
      style={({ pressed }) => [styles.roomRow, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.roomRowInner}>
        <View style={styles.roomNameRow}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.topicRoomName}
          </Text>
          {room.isJoined && (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedBadgeText}>참여중</Text>
            </View>
          )}
        </View>
        <Text style={styles.roomSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.roomRowRight}>
        {room.activeUserNumber != null && room.activeUserNumber > 0 && (
          <View style={styles.activeUserPill}>
            <View style={styles.activeDot} />
            <Text style={styles.activeUserText}>
              {room.activeUserNumber}명
            </Text>
          </View>
        )}
        <Text style={styles.roomChevron}>›</Text>
      </View>
    </Pressable>
  )
}

// ─── Topic room card (horizontal scroll) ─────────────────────────────────────

function TopicRoomCard({
  room,
  onPress,
}: {
  room: TopicRoomItem
  onPress: () => void
}) {
  const subtitle = formatTopicRoomSubtitle(room.worksType, room.worksName)
  return (
    <Pressable
      style={({ pressed }) => [
        styles.popularCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {room.thumbnailUrl ? (
        <Image
          source={{ uri: room.thumbnailUrl }}
          style={styles.popularCardThumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.popularCardThumb, styles.popularCardThumbFallback]}>
          <Text style={styles.popularCardThumbInitial}>
            {(room.worksName ?? '?')[0]}
          </Text>
        </View>
      )}
      <View style={styles.popularCardBody}>
        <Text style={styles.popularCardName} numberOfLines={2}>
          {room.topicRoomName}
        </Text>
        <Text style={styles.popularCardSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        {room.activeUserNumber != null && room.activeUserNumber > 0 && (
          <View style={styles.activeUserPill}>
            <View style={styles.activeDot} />
            <Text style={styles.activeUserText}>
              {room.activeUserNumber}명
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

// ─── Empty note ───────────────────────────────────────────────────────────────

function EmptyNote({
  text,
  style,
}: {
  text: string
  style?: object
}) {
  return <Text style={[styles.emptyNote, style]}>{text}</Text>
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_RADIUS = 12
const AVATAR_SIZE = 34
const THUMB_SIZE = 72

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 1.5,
  },
  greeting: {
    fontSize: 14,
    color: C.textSecondary,
  },

  // Section
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 14,
  },
  sectionTitlePadded: { paddingHorizontal: 0 },
  sectionLoader: { alignSelf: 'flex-start', marginBottom: 8 },
  errorText: { fontSize: 13, color: C.error },
  errorTextPad: { paddingHorizontal: 0 },

  // Feed card
  feedCard: {
    backgroundColor: C.card,
    borderRadius: CARD_RADIUS,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardPressed: { opacity: 0.72 },

  feedAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  feedAvatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  feedAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },
  feedAuthorMeta: { flex: 1 },
  feedAuthorName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  feedTime: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  feedLikedBadge: {
    fontSize: 14,
    color: C.liked,
  },

  feedContent: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },

  spoilerBox: {
    backgroundColor: C.spoilerBg,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  spoilerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  spoilerHint: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedCounts: { flexDirection: 'row', gap: 12 },
  feedCountText: { fontSize: 12, color: C.textMuted },
  feedChevron: { fontSize: 18, color: C.textMuted },

  // TopicRoom row
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  roomRowInner: { flex: 1, marginRight: 8 },
  roomNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    flexShrink: 1,
  },
  joinedBadge: {
    backgroundColor: C.badgeBg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  joinedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.badgeText,
  },
  roomSubtitle: { fontSize: 12, color: C.textMuted },
  roomRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomChevron: { fontSize: 18, color: C.textMuted },

  // Popular rooms (horizontal)
  popularList: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  popularEmpty: { paddingHorizontal: 20 },

  popularCard: {
    width: 148,
    backgroundColor: C.card,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  popularCardThumb: {
    width: '100%',
    height: THUMB_SIZE,
    backgroundColor: C.primaryLight,
  },
  popularCardThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularCardThumbInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: C.primary,
  },
  popularCardBody: {
    padding: 10,
    gap: 3,
  },
  popularCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    lineHeight: 18,
  },
  popularCardSubtitle: {
    fontSize: 11,
    color: C.textMuted,
  },

  // Shared: active user pill
  activeUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.activeDot,
  },
  activeUserText: {
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: '500',
  },

  // Empty
  emptyNote: {
    fontSize: 13,
    color: C.textMuted,
    paddingVertical: 6,
  },
})
