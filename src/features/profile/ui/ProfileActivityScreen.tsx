import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Gray, Magenta, Typography } from '../../../theme'
import { useMe } from '../hooks'
import type {
  ProfileActivityBoardItem,
  ProfileActivityReplyItem,
} from '../api/profile-activity.api'
import { useProfileActivityBoards } from '../hooks/useProfileActivityBoards'
import { useProfileActivityLikes } from '../hooks/useProfileActivityLikes'
import { useProfileActivityReplies } from '../hooks/useProfileActivityReplies'
import { ProfilePreferenceTabs } from './ProfilePreferenceTabs'
import { ProfileTopBar } from './ProfileTopBar'
import { ProfileUserSummary } from './ProfileUserSummary'
import { ProfileActivityTabs, type ProfileActivityTab } from './ProfileActivityTabs'
import { ProfileActivityBoardCard } from './ProfileActivityBoardItem'
import { ProfileActivityCommentItem } from './ProfileActivityCommentItem'
import { ProfileActivityEmptyState } from './ProfileActivityEmptyState'

const TAB_VALUES: ProfileActivityTab[] = ['posts', 'comments', 'likes']

const isActivityTab = (value: string | string[] | undefined): value is ProfileActivityTab =>
  typeof value === 'string' && TAB_VALUES.includes(value as ProfileActivityTab)

export function ProfileActivityScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{ tab?: string }>()
  const activeTab: ProfileActivityTab = isActivityTab(params.tab) ? params.tab : 'posts'

  const { data: me, isLoading: meLoading, isError: meError } = useMe()
  const boardsQuery = useProfileActivityBoards(activeTab === 'posts')
  const repliesQuery = useProfileActivityReplies(activeTab === 'comments')
  const likesQuery = useProfileActivityLikes(activeTab === 'likes')
  const [openCommentMenuId, setOpenCommentMenuId] = useState<number | null>(null)

  const query =
    activeTab === 'posts'
      ? boardsQuery
      : activeTab === 'comments'
        ? repliesQuery
        : likesQuery

  const items = useMemo(
    () =>
      activeTab === 'comments'
        ? repliesQuery.data?.pages.flatMap((page) => page.content) ?? []
        : activeTab === 'posts'
          ? boardsQuery.data?.pages.flatMap((page) => page.content) ?? []
          : likesQuery.data?.pages.flatMap((page) => page.content) ?? [],
    [activeTab, boardsQuery.data?.pages, likesQuery.data?.pages, repliesQuery.data?.pages],
  )

  const handleChangeTopTab = (next: ProfileActivityTab) => {
    if (next === activeTab) return
    router.replace(`/profile/my-activity?tab=${next}` as const)
  }

  const renderHeader = () => (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top }}>
        <ProfileTopBar onPressSettings={() => router.push('/profile/settings')} />
      </View>
      {me ? <ProfileUserSummary me={me} /> : null}
      <ProfilePreferenceTabs />
      <ProfileActivityTabs activeTab={activeTab} onChange={handleChangeTopTab} />
    </>
  )

  const renderFooter = () => {
    if (!query.hasNextPage && !query.isFetchingNextPage) return <View style={styles.bottomSpacer} />

    return (
      <View style={styles.footer}>
        {query.isFetchingNextPage ? (
          <Text style={styles.footerText}>불러오는 중...</Text>
        ) : (
          <Pressable onPress={() => void query.fetchNextPage()}>
            <Text style={styles.footerText}>더 보기</Text>
          </Pressable>
        )}
      </View>
    )
  }

  if (meLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Magenta[300]} />
      </View>
    )
  }

  if (meError || !me) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>프로필을 불러오지 못했어요.</Text>
        <Text style={styles.errorHint}>잠시 후 다시 시도해 주세요.</Text>
      </View>
    )
  }

  return (
    <FlatList<ProfileActivityBoardItem | ProfileActivityReplyItem>
      data={items}
      key={activeTab}
      style={styles.list}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage()
        }
      }}
      renderItem={(info) =>
        renderActivityItem(
          activeTab,
          info,
          me.userId,
          openCommentMenuId,
          setOpenCommentMenuId,
        )
      }
      ListEmptyComponent={
        query.isLoading ? (
          <ProfileActivityEmptyState message="불러오는 중..." />
        ) : query.isError ? (
          <ProfileActivityEmptyState message="활동 내역을 불러오지 못했어요." />
        ) : (
          <ProfileActivityEmptyState message={getEmptyMessage(activeTab)} />
        )
      }
    />
  )
}

function renderActivityItem(
  activeTab: ProfileActivityTab,
  info: ListRenderItemInfo<ProfileActivityBoardItem | ProfileActivityReplyItem>,
  userId: number,
  openCommentMenuId: number | null,
  setOpenCommentMenuId: (value: number | null) => void,
) {
  if (activeTab === 'comments') {
    const item = info.item as ProfileActivityReplyItem
    return (
      <ProfileActivityCommentItem
        item={item}
        currentUserId={userId}
        isMenuOpen={openCommentMenuId === item.reply.replyId}
        onToggleMenu={() =>
          setOpenCommentMenuId(
            openCommentMenuId === item.reply.replyId ? null : item.reply.replyId,
          )
        }
        queryKey={['profile', 'activity', 'replies']}
      />
    )
  }

  const item = info.item as ProfileActivityBoardItem
  return (
    <ProfileActivityBoardCard
      item={item}
      currentUserId={userId}
      likedMode={activeTab === 'likes'}
      queryKey={
        activeTab === 'posts'
          ? ['profile', 'activity', 'boards']
          : ['profile', 'activity', 'likes']
      }
    />
  )
}

function getEmptyMessage(tab: ProfileActivityTab) {
  switch (tab) {
    case 'posts':
      return '아직 작성한 글이 없어요.'
    case 'comments':
      return '아직 작성한 댓글이 없어요.'
    case 'likes':
      return '아직 좋아요한 글이 없어요.'
    default:
      return '활동 내역이 없어요.'
  }
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorText: {
    ...Typography.body1Medium,
    color: Gray[900],
  },
  errorHint: {
    marginTop: 6,
    ...Typography.caption1Medium,
    color: Gray[500],
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  footerText: {
    ...Typography.body2Medium,
    color: Gray[400],
  },
  bottomSpacer: {
    height: 24,
  },
})
