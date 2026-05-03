import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useProfileStore } from '../../profile'
import { C } from '../../../theme/colors'
import { S } from '../../../theme/spacing'
import { Typography } from '../../../theme/typography'
import type { TopicRoomItem } from '../api/topicroom.schema'
import {
  useJoinTopicRoom,
  useMyTopicRoomsAll,
  usePopularTopicRooms,
  useTodayTopicRooms,
  useTopicRoomSearchInfinite,
} from '../hooks'
import { TopicRoomCard } from './TopicRoomCard'
import { TopicRoomParticipationPager } from './TopicRoomParticipationPager'
import {
  TopicRoomSearchEmpty,
  TopicRoomSearchList,
} from './TopicRoomSearchList'
import { TopicRoomSearchBar } from './TopicRoomSearchBar'

export function TopicRoomTabScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [keyword, setKeyword] = useState('')

  const nickname = useProfileStore((state) => state.me?.nickName ?? '나의')

  const todayQuery = useTodayTopicRooms()
  const popularQuery = usePopularTopicRooms()
  const myQuery = useMyTopicRoomsAll()

  const trimmedKeyword = keyword.trim()
  const searchQuery = useTopicRoomSearchInfinite(trimmedKeyword)

  const searchResults = useMemo(
    () => searchQuery.data?.pages.flatMap((page) => page.content ?? []) ?? [],
    [searchQuery.data],
  )

  const joinMutation = useJoinTopicRoom()

  const handleEnterRoom = useCallback(
    (item: TopicRoomItem) => {
      const navigate = () => router.push(`/topicroom/${item.topicRoomId}` as const)

      if (item.isJoined) {
        navigate()
        return
      }

      joinMutation.mutate(item.topicRoomId, { onSuccess: navigate })
    },
    [joinMutation, router],
  )

  const isJoiningId = joinMutation.isPending ? joinMutation.variables : null
  const isSearchMode = trimmedKeyword.length > 0

  if (isSearchMode) {
    return (
      <View style={styles.screen}>
        <TopicRoomSearchBar
          topInset={insets.top}
          value={keyword}
          onChangeText={setKeyword}
          onBackPress={() => router.push('/(tabs)' as const)}
        />

        <TopicRoomSearchList
          data={searchResults}
          onPressItem={handleEnterRoom}
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
              void searchQuery.fetchNextPage()
            }
          }}
          empty={
            searchQuery.isLoading ? (
              <ActivityIndicator
                size="large"
                color={C.primary}
                style={styles.searchLoader}
              />
            ) : searchQuery.isError ? (
              <Text style={styles.inlineErrorText}>검색 결과를 불러오지 못했어요.</Text>
            ) : (
              <TopicRoomSearchEmpty keyword={trimmedKeyword} />
            )
          }
          footer={
            searchQuery.isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={C.primary}
                style={styles.searchLoader}
              />
            ) : null
          }
        />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <TopicRoomSearchBar
        topInset={insets.top}
        value={keyword}
        onChangeText={setKeyword}
        onBackPress={() => router.push('/(tabs)' as const)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{nickname}이 참여 중인 토픽룸</Text>
        </View>
        {myQuery.isLoading ? (
          <ActivityIndicator size="small" color={C.primary} style={styles.sectionLoader} />
        ) : myQuery.isError ? (
          <Text style={styles.inlineErrorText}>참여 중인 토픽룸을 불러오지 못했어요.</Text>
        ) : (myQuery.data?.length ?? 0) === 0 ? (
          <Text style={styles.emptyText}>참여 중인 토픽룸이 없어요.</Text>
        ) : (
          <TopicRoomParticipationPager
            items={(myQuery.data ?? []).map((item) => ({ ...item, isJoined: true }))}
            onPressItem={handleEnterRoom}
          />
        )}

        <StackedCoverSection
          title="오늘의 토픽룸"
          data={todayQuery.data ?? []}
          isLoading={todayQuery.isLoading}
          isError={todayQuery.isError}
          emptyText="오늘의 토픽룸이 없어요."
          onPressItem={handleEnterRoom}
          joiningId={isJoiningId}
          hotLabel="HOT"
        />

        <StackedCoverSection
          title="지금 HOT한 토픽룸"
          data={popularQuery.data ?? []}
          isLoading={popularQuery.isLoading}
          isError={popularQuery.isError}
          emptyText="지금 HOT한 토픽룸이 없어요."
          onPressItem={handleEnterRoom}
          joiningId={isJoiningId}
          hotLabel="HOT"
        />
      </ScrollView>
    </View>
  )
}

function StackedCoverSection({
  title,
  data,
  isLoading,
  isError,
  emptyText,
  onPressItem,
  joiningId,
  hotLabel,
}: {
  title: string
  data: TopicRoomItem[]
  isLoading: boolean
  isError: boolean
  emptyText: string
  onPressItem: (item: TopicRoomItem) => void
  joiningId: number | null
  hotLabel: string
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={C.primary} style={styles.sectionLoader} />
      ) : isError ? (
        <Text style={styles.inlineErrorText}>토픽룸을 불러오지 못했어요.</Text>
      ) : data.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        <View style={styles.coverList}>
          {data.map((item) => (
            <TopicRoomCard
              key={item.topicRoomId}
              item={item}
              onPress={() => onPressItem(item)}
              isJoining={joiningId === item.topicRoomId}
              hotLabel={hotLabel}
            />
          ))}
        </View>
      )}
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
  sectionBlock: {
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    ...Typography.heading1,
    color: C.text,
  },
  sectionLoader: {
    marginVertical: 12,
  },
  emptyText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    paddingHorizontal: 20,
  },
  inlineErrorText: {
    ...Typography.body2Medium,
    color: C.error,
    paddingHorizontal: 20,
  },
  coverList: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  searchLoader: {
    marginTop: 40,
  },
})
