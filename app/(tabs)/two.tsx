import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTodayTopicRooms } from '../../src/hooks/topicroom/useTodayTopicRooms'
import { usePopularTopicRooms } from '../../src/hooks/topicroom/usePopularTopicRooms'
import { useMyTopicRoomsAll } from '../../src/hooks/topicroom/useMyTopicRoomsAll'
import { useTopicRoomSearchInfinite } from '../../src/hooks/topicroom/useTopicRoomSearchInfinite'
import { useJoinTopicRoom } from '../../src/hooks/topicroom/useJoinTopicRoom'
import { TopicRoomCard } from '../../src/components/topicroom/TopicRoomCard'
import { C } from '../../src/theme/colors'
import type { TopicRoomItem } from '../../src/lib/api/topicroom/topicroom.api'

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TopicRoomTabScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [keyword, setKeyword] = useState('')

  // ── Data hooks ────────────────────────────────────────────────────────────
  const todayQuery = useTodayTopicRooms()
  const popularQuery = usePopularTopicRooms()
  const myQuery = useMyTopicRoomsAll()

  const trimmedKeyword = keyword.trim()
  const searchQuery = useTopicRoomSearchInfinite(trimmedKeyword)

  const searchResults: TopicRoomItem[] = useMemo(
    () => searchQuery.data?.pages.flatMap((p) => p.content) ?? [],
    [searchQuery.data],
  )

  // ── Join + navigate ───────────────────────────────────────────────────────
  const joinMutation = useJoinTopicRoom()

  const handleEnterRoom = useCallback(
    (item: TopicRoomItem) => {
      const navigate = () => router.push(`/topicroom/${item.topicRoomId}`)
      if (item.isJoined) {
        navigate()
        return
      }
      joinMutation.mutate(item.topicRoomId, { onSuccess: navigate })
    },
    [joinMutation, router],
  )

  const isJoiningId = joinMutation.isPending ? joinMutation.variables : null

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isSearchMode = trimmedKeyword.length > 0

  const paddingTop = insets.top + 16

  // ─── Search results view ──────────────────────────────────────────────────
  if (isSearchMode) {
    return (
      <View style={[styles.container, { paddingTop }]}>
        {/* Search bar */}
        <SearchBar
          value={keyword}
          onChangeText={setKeyword}
          onClear={() => setKeyword('')}
        />

        <FlatList
          data={searchResults}
          keyExtractor={(item) => String(item.topicRoomId)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TopicRoomCard
              item={item}
              onPress={() => handleEnterRoom(item)}
              isJoining={isJoiningId === item.topicRoomId}
            />
          )}
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
              searchQuery.fetchNextPage()
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            searchQuery.isLoading ? (
              <ActivityIndicator style={styles.sectionLoader} size="large" color={C.primary} />
            ) : searchQuery.isError ? (
              <Text style={styles.errorText}>검색 결과를 불러오지 못했습니다.</Text>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>검색 결과 없음</Text>
                <Text style={styles.emptyHint}>
                  "{trimmedKeyword}"와 일치하는 토픽룸이 없습니다.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            searchQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color={C.primary} style={styles.sectionLoader} />
            ) : null
          }
        />
      </View>
    )
  }

  // ─── Default discovery view ────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop }]}>
      {/* Search bar */}
      <SearchBar
        value={keyword}
        onChangeText={setKeyword}
        onClear={() => setKeyword('')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 참여 중인 토픽룸 ───────────────────────────────────────── */}
        <Section
          title="참여 중인 토픽룸"
          isLoading={myQuery.isLoading}
          isError={myQuery.isError}
          isEmpty={!myQuery.isLoading && !myQuery.isError && (myQuery.data?.length ?? 0) === 0}
          emptyText="참여 중인 토픽룸이 없습니다."
        >
          {myQuery.data?.map((item) => (
            <TopicRoomCard
              key={item.topicRoomId}
              item={{ ...item, isJoined: true }}
              onPress={() => handleEnterRoom({ ...item, isJoined: true })}
              isJoining={isJoiningId === item.topicRoomId}
            />
          ))}
        </Section>

        {/* ── 오늘의 토픽룸 ─────────────────────────────────────────── */}
        <Section
          title="오늘의 토픽룸"
          isLoading={todayQuery.isLoading}
          isError={todayQuery.isError}
          isEmpty={!todayQuery.isLoading && !todayQuery.isError && (todayQuery.data?.length ?? 0) === 0}
          emptyText="오늘의 토픽룸이 없습니다."
        >
          {todayQuery.data?.map((item) => (
            <TopicRoomCard
              key={item.topicRoomId}
              item={item}
              onPress={() => handleEnterRoom(item)}
              isJoining={isJoiningId === item.topicRoomId}
            />
          ))}
        </Section>

        {/* ── 인기 토픽룸 ───────────────────────────────────────────── */}
        <Section
          title="인기 토픽룸"
          isLoading={popularQuery.isLoading}
          isError={popularQuery.isError}
          isEmpty={!popularQuery.isLoading && !popularQuery.isError && (popularQuery.data?.length ?? 0) === 0}
          emptyText="인기 토픽룸이 없습니다."
        >
          {popularQuery.data?.map((item) => (
            <TopicRoomCard
              key={item.topicRoomId}
              item={item}
              onPress={() => handleEnterRoom(item)}
              isJoining={isJoiningId === item.topicRoomId}
            />
          ))}
        </Section>
      </ScrollView>
    </View>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

type SearchBarProps = {
  value: string
  onChangeText: (t: string) => void
  onClear: () => void
}

function SearchBar({ value, onChangeText, onClear }: SearchBarProps) {
  return (
    <View style={styles.searchBarWrap}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="토픽룸 또는 작품 검색…"
          placeholderTextColor={C.textMuted}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 ? (
          <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="검색어 지우기">
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

type SectionProps = {
  title: string
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  emptyText: string
  children?: React.ReactNode
}

function Section({ title, isLoading, isError, isEmpty, emptyText, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={C.primary} style={styles.sectionLoader} />
      ) : isError ? (
        <Text style={styles.errorText}>불러오지 못했습니다.</Text>
      ) : isEmpty ? (
        <Text style={styles.emptyHint}>{emptyText}</Text>
      ) : (
        children
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },

  // Search bar
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: 0,
  },
  clearBtn: { fontSize: 14, color: C.textMuted, paddingHorizontal: 4 },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
  },
  sectionLoader: { marginVertical: 10, alignSelf: 'center' },
  errorText: { fontSize: 13, color: C.error, paddingVertical: 6 },
  emptyHint: { fontSize: 13, color: C.textMuted, paddingVertical: 6 },

  // Empty state (search)
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
})
