import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMe } from '../../src/hooks/profile/useMe'
import { useTodayHomeFeeds } from '../../src/hooks/homeFeed/useTodayHomeFeeds'
import { useTodayTopicRooms } from '../../src/hooks/topicroom/useTodayTopicRooms'
import { usePopularTopicRooms } from '../../src/hooks/topicroom/usePopularTopicRooms'
import { formatTopicRoomSubtitle } from '../../src/lib/api/topicroom'
import type { TodayFeedItem } from '../../src/lib/api/homeFeed/homeFeed.schema'
import type { TopicRoomItem } from '../../src/lib/api/topicroom/topicroom.schema'

// TODO(Phase home-ui): Replace with the final home design.

export default function HomeScreen() {
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

  const goToRoom = (roomId: number) => {
    router.push(`/topicroom/${roomId}`)
  }

  const goToWorks = (worksId: number) => {
    router.push(`/works/${worksId}`)
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {meLoading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.greeting}>
            {me ? `안녕하세요, ${me.nickName}님 👋` : 'STORIX'}
          </Text>
        )}
      </View>

      {/* ── Today Feeds ─────────────────────────────────────────────────── */}
      <Section title="오늘의 피드" loading={feedsLoading} error={feedsError}>
        {feeds && feeds.length === 0 && <EmptyNote text="오늘의 피드가 없습니다." />}
        {feeds?.map((item) => {
          // Navigate to works detail only when the post is linked to a specific work.
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

      {/* ── Today TopicRooms ─────────────────────────────────────────────── */}
      <Section title="오늘의 토픽룸" loading={todayLoading} error={todayError}>
        {todayRooms && todayRooms.length === 0 && (
          <EmptyNote text="오늘의 토픽룸이 없습니다." />
        )}
        {todayRooms?.map((room) => (
          <TopicRoomCard
            key={`today_${room.topicRoomId}`}
            room={room}
            onPress={() => goToRoom(room.topicRoomId)}
          />
        ))}
      </Section>

      {/* ── Popular TopicRooms ───────────────────────────────────────────── */}
      <Section title="지금 핫한 토픽룸" loading={popularLoading} error={popularError}>
        {popularRooms && popularRooms.length === 0 && (
          <EmptyNote text="인기 토픽룸이 없습니다." />
        )}
        {popularRooms?.map((room) => (
          <TopicRoomCard
            key={`popular_${room.topicRoomId}`}
            room={room}
            onPress={() => goToRoom(room.topicRoomId)}
          />
        ))}
      </Section>
    </ScrollView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  loading,
  error,
  children,
}: {
  title: string
  loading: boolean
  error: boolean
  children: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading && <ActivityIndicator style={styles.sectionLoader} />}
      {!loading && error && (
        <Text style={styles.sectionError}>데이터를 불러오지 못했습니다.</Text>
      )}
      {!loading && !error && children}
    </View>
  )
}

function FeedCard({
  item,
  onPress,
}: {
  item: TodayFeedItem
  onPress?: () => void
}) {
  const { profile, board } = item
  const preview = board.isSpoiler
    ? '[스포일러]'
    : board.content.length > 60
      ? board.content.slice(0, 60) + '…'
      : board.content

  const body = (
    <>
      <Text style={styles.feedAuthor}>{profile.nickName}</Text>
      <Text style={styles.feedContent}>{preview}</Text>
      <View style={styles.feedMeta}>
        <Text style={styles.feedMetaText}>♡ {board.likeCount}</Text>
        <Text style={styles.feedMetaText}>💬 {board.replyCount}</Text>
      </View>
    </>
  )

  // Tappable only when the post is linked to a works (worksId present).
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.feedCard, pressed && styles.feedCardPressed]}
        onPress={onPress}
      >
        {body}
        <Text style={styles.feedChevron}>›</Text>
      </Pressable>
    )
  }

  return <View style={styles.feedCard}>{body}</View>
}

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
      style={({ pressed }) => [styles.roomCard, pressed && styles.roomCardPressed]}
      onPress={onPress}
    >
      <View style={styles.roomCardInner}>
        <Text style={styles.roomName} numberOfLines={1}>
          {room.topicRoomName}
        </Text>
        <Text style={styles.roomSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {room.activeUserNumber != null && room.activeUserNumber > 0 && (
        <Text style={styles.roomUsers}>{room.activeUserNumber}명</Text>
      )}
      <Text style={styles.roomChevron}>›</Text>
    </Pressable>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <Text style={styles.emptyNote}>{text}</Text>
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },

  // Header
  header: { marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#111' },

  // Section
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  sectionLoader: { alignSelf: 'flex-start' },
  sectionError: { fontSize: 13, color: '#c00' },

  // Feed card
  feedCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  feedCardPressed: { opacity: 0.7 },
  feedChevron: { fontSize: 16, color: '#bbb', alignSelf: 'flex-end', marginTop: 4 },
  feedAuthor: { fontSize: 12, color: '#888', marginBottom: 4 },
  feedContent: { fontSize: 14, color: '#222', lineHeight: 20 },
  feedMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  feedMetaText: { fontSize: 12, color: '#999' },

  // TopicRoom card
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  roomCardPressed: { opacity: 0.7 },
  roomCardInner: { flex: 1 },
  roomName: { fontSize: 14, fontWeight: '600', color: '#111' },
  roomSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  roomUsers: { fontSize: 12, color: '#555', marginRight: 6 },
  roomChevron: { fontSize: 18, color: '#bbb' },

  // Empty
  emptyNote: { fontSize: 13, color: '#aaa', paddingVertical: 4 },
})
