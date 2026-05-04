import { useMemo, useState, type ReactElement } from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Gray, Typography } from '../../../theme'
import type {
  ProfileActivityBoardItem,
  ProfileActivityReplyItem,
} from '../api/profile-activity.api'
import { useProfileActivityBoards } from '../hooks/useProfileActivityBoards'
import { useProfileActivityLikes } from '../hooks/useProfileActivityLikes'
import { useProfileActivityReplies } from '../hooks/useProfileActivityReplies'
import { ProfileActivityBoardCard } from './ProfileActivityBoardItem'
import { ProfileActivityCommentItem } from './ProfileActivityCommentItem'
import { ProfileActivityEmptyState } from './ProfileActivityEmptyState'
import { ProfileActivityTabs, type ProfileActivityTab } from './ProfileActivityTabs'

type Props = {
  activeTab: ProfileActivityTab
  onChangeTab: (tab: ProfileActivityTab) => void
  currentUserId: number
  header?: ReactElement | null
  bottomInset?: number
}

export function ProfileActivityContent({
  activeTab,
  onChangeTab,
  currentUserId,
  header = null,
  bottomInset = 0,
}: Props) {
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

  const handleChangeTab = (next: ProfileActivityTab) => {
    if (next === activeTab) return
    setOpenCommentMenuId(null)
    onChangeTab(next)
  }

  const renderFooter = () => {
    if (!query.hasNextPage && !query.isFetchingNextPage) return <View style={styles.bottomSpacer} />

    return (
      <View style={styles.footer}>
        {query.isFetchingNextPage ? (
          <Text style={styles.footerText}>遺덈윭?ㅻ뒗 以?..</Text>
        ) : (
          <Pressable onPress={() => void query.fetchNextPage()}>
            <Text style={styles.footerText}>??蹂닿린</Text>
          </Pressable>
        )}
      </View>
    )
  }

  const renderHeader = () => (
    <>
      {header}
      <ProfileActivityTabs activeTab={activeTab} onChange={handleChangeTab} />
    </>
  )

  return (
    <FlatList<ProfileActivityBoardItem | ProfileActivityReplyItem>
      data={items}
      key={activeTab}
      style={styles.list}
      contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
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
          currentUserId,
          openCommentMenuId,
          setOpenCommentMenuId,
        )
      }
      ListEmptyComponent={
        query.isLoading ? (
          <ProfileActivityEmptyState message="遺덈윭?ㅻ뒗 以?.." />
        ) : query.isError ? (
          <ProfileActivityEmptyState message="?쒕룞 ?댁뿭??遺덈윭?ㅼ? 紐삵뻽?댁슂." />
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
      return '?꾩쭅 ?묒꽦??湲???놁뼱??'
    case 'comments':
      return '?꾩쭅 ?묒꽦???볤????놁뼱??'
    case 'likes':
      return '?꾩쭅 醫뗭븘?뷀븳 湲???놁뼱??'
    default:
      return '?쒕룞 ?댁뿭???놁뼱??'
  }
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
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
