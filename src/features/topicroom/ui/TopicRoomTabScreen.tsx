import { useCallback, useMemo, useRef, useState } from 'react'
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
import { useRouter } from 'expo-router'
import { useProfileStore } from '../../profile'
import { useRecommendedHashtags } from '../../feed/hooks/hashtag'
import { SearchEmptyState } from '../../search'
import { C } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'
import type { TopicRoomItem } from '../api/topicroom.schema'
import {
  useJoinTopicRoom,
  useMyTopicRoomsAll,
  usePopularTopicRooms,
  useTodayTopicRooms,
  useTopicRoomSearchInfinite,
} from '../hooks'
import { isTopicRoomParticipationLimitError } from '../services/topicRoomLimit'
import { HotTopicRoomCard } from './HotTopicRoomCard'
import { TopicRoomCard } from './TopicRoomCard'
import { TopicRoomParticipationPager } from './TopicRoomParticipationPager'
import { TopicRoomSearchList } from './TopicRoomSearchList'
import { TopicRoomSearchBar } from './TopicRoomSearchBar'
import { TopicRoomLimitModal } from './TopicRoomLimitModal'

const warningIcon = require('../../../../assets/icons/search/warning.png')

export function TopicRoomTabScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const [keyword, setKeyword] = useState('')
  const [limitModalVisible, setLimitModalVisible] = useState(false)

  const nickname = useProfileStore((state) => state.me?.nickName ?? '나의')

  const todayQuery = useTodayTopicRooms()
  const popularQuery = usePopularTopicRooms()
  const myQuery = useMyTopicRoomsAll()
  const recommendedHashtagsQuery = useRecommendedHashtags()

  const recommendationKeyword =
    recommendedHashtagsQuery.data?.find(
      (item) => item.name.trim().length > 0,
    )?.name ?? null

  const trimmedKeyword = keyword.trim()
  const searchQuery = useTopicRoomSearchInfinite(trimmedKeyword)

  const searchResults = useMemo(
    () => searchQuery.data?.pages.flatMap((page) => page.content ?? []) ?? [],
    [searchQuery.data],
  )

  const joinMutation = useJoinTopicRoom()

  const handleEnterRoom = useCallback(
    (item: TopicRoomItem) => {
      const navigate = () =>
        router.push({
          pathname: '/topicroom/[roomId]',
          params: {
            roomId: String(item.topicRoomId),
            topicRoomName: item.topicRoomName ?? '',
            worksName: item.worksName ?? '',
            worksType: item.worksType ?? '',
            activeUserNumber: String(item.activeUserNumber ?? ''),
          },
        })

      if (item.isJoined) {
        navigate()
        return
      }

      joinMutation.mutate(item.topicRoomId, {
        onSuccess: navigate,
        onError: (err) => {
          if (isTopicRoomParticipationLimitError(err)) {
            setLimitModalVisible(true)
          }
        },
      })
    },
    [joinMutation, router],
  )

  const isJoiningId = joinMutation.isPending ? joinMutation.variables : null
  const isSearchMode = trimmedKeyword.length > 0

  const handleBackToFeed = useCallback(() => {
    router.push({
      pathname: '/(tabs)/feed',
      params: { section: 'topicroom', landingKey: String(Date.now()) },
    })
  }, [router])

  if (isSearchMode) {
    return (
      <View style={styles.screen}>
        <TopicRoomSearchBar
          topInset={insets.top}
          value={keyword}
          onChangeText={setKeyword}
          onBackPress={handleBackToFeed}
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
            ) : (
              <SearchEmptyState
                recommendationKeyword={recommendationKeyword}
                onPressRecommendation={setKeyword}
              />
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
        <TopicRoomLimitModal
          visible={limitModalVisible}
          onClose={() => setLimitModalVisible(false)}
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
        onBackPress={handleBackToFeed}
      />

      <ScrollView
        ref={scrollRef}
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
          <JoinedTopicRoomEmpty
            onPress={() => scrollRef.current?.scrollTo({ y: 240, animated: true })}
          />
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
          variant="hotList"
        />
      </ScrollView>
      <TopicRoomLimitModal
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
      />
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
  variant = 'cover',
}: {
  title: string
  data: TopicRoomItem[]
  isLoading: boolean
  isError: boolean
  emptyText: string
  onPressItem: (item: TopicRoomItem) => void
  joiningId: number | null
  hotLabel?: string
  variant?: 'cover' | 'hotList'
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
        <View style={variant === 'hotList' ? styles.hotList : styles.coverList}>
          {(variant === 'hotList' ? data.slice(0, 3) : data).map((item, index) =>
            variant === 'hotList' ? (
              <HotTopicRoomCard
                key={item.topicRoomId}
                item={item}
                rank={index + 1}
                onPress={() => onPressItem(item)}
                isJoining={joiningId === item.topicRoomId}
              />
            ) : (
              <TopicRoomCard
                key={item.topicRoomId}
                item={item}
                onPress={() => onPressItem(item)}
                isJoining={joiningId === item.topicRoomId}
                hotLabel={hotLabel}
              />
            ),
          )}
        </View>
      )}
    </View>
  )
}

function JoinedTopicRoomEmpty({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.joinedEmpty}>
      <Image source={warningIcon} style={styles.joinedEmptyIcon} contentFit="contain" />
      <Text style={styles.joinedEmptyTitle}>아직 참여 중인 토픽룸이 없어요</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.joinedEmptyButton,
          pressed && styles.joinedEmptyButtonPressed,
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.joinedEmptyButtonText}>토픽룸 참여하러 가기</Text>
      </Pressable>
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
  hotList: {
    width: 336,
    maxWidth: '100%',
    alignSelf: 'center',
    padding: 12,
    gap: 12,
    marginBottom: 16,
    backgroundColor: C.card,
    borderRadius: 8,
    shadowColor: C.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  joinedEmpty: {
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  joinedEmptyIcon: {
    width: 80,
    height: 80,
  },
  joinedEmptyTitle: {
    ...Typography.heading2,
    color: C.text,
    textAlign: 'center',
    marginTop: 14,
  },
  joinedEmptyButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: C.card,
  },
  joinedEmptyButtonPressed: {
    opacity: 0.75,
  },
  joinedEmptyButtonText: {
    ...Typography.caption1Semibold,
    color: C.primary,
  },
  searchLoader: {
    marginTop: 40,
  },
})
