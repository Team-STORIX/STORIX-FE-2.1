import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { deleteReply, toggleReplyLike } from '../../feed/api/feed/readerBoardDetail.api'
import { reportReply } from '../../feed/api/feed/readerReply.api'
import type { ProfileActivityReplyItem } from '../api/profile-activity.api'
import { ReportModal } from '../../feed/ui/ReportModal'
import { FeedDeleteConfirmModal } from '../../feed/ui/FeedDeleteConfirmModal'
import { formatCreatedAtLabel } from '../../../lib/utils/formatCreatedAtLabel'
import { C, Gray, Radius, Typography } from '../../../theme'

const defaultProfileImage = require('../../../../assets/placeholders/profile-default.png')
const likeIcon = require('../../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../../assets/icons/common/icon-like-pink.svg')
const menuIcon = require('../../../../assets/icons/common/menu-3dots.svg')
const commentDropdown = require('../../../../assets/icons/common/comment-dropdown.svg')
const deleteDropdown = require('../../../../assets/icons/common/delete-dropdown.svg')

export function ProfileActivityCommentItem({
  item,
  currentUserId,
  currentUserProfileImageUrl,
  currentUserNickName,
  isMenuOpen,
  onToggleMenu,
  queryKey,
}: {
  item: ProfileActivityReplyItem
  currentUserId?: number
  currentUserProfileImageUrl?: string | null
  currentUserNickName?: string
  isMenuOpen: boolean
  onToggleMenu: () => void
  queryKey: readonly string[]
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const isMine = currentUserId != null && item.reply.userId === currentUserId
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const displayCreatedAt = formatCreatedAtLabel(item.reply.lastCreatedTime)
  const profileImageUrl = isMine
    ? currentUserProfileImageUrl
    : item.profile.profileImageUrl
  const nickName = isMine && currentUserNickName
    ? currentUserNickName
    : item.profile.nickName

  const syncReplyItem = (
    replyId: number,
    updater: (target: ProfileActivityReplyItem) => ProfileActivityReplyItem | null,
  ) => {
    qc.setQueryData(queryKey, (prev: any) => {
      if (!prev?.pages) return prev
      return {
        ...prev,
        pages: prev.pages.map((page: any) => ({
          ...page,
          content: page.content
            .map((entry: ProfileActivityReplyItem) =>
              entry.reply.replyId === replyId ? updater(entry) : entry,
            )
            .filter(Boolean),
        })),
      }
    })
  }

  const handleToggleLike = async () => {
    const optimisticLiked = !item.reply.isLiked
    const optimisticCount = Math.max(
      0,
      item.reply.likeCount + (optimisticLiked ? 1 : -1),
    )

    syncReplyItem(item.reply.replyId, (target) => ({
      ...target,
      reply: {
        ...target.reply,
        isLiked: optimisticLiked,
        likeCount: optimisticCount,
      },
    }))

    try {
      const result = await toggleReplyLike({
        boardId: item.reply.boardId,
        replyId: item.reply.replyId,
      })
      syncReplyItem(item.reply.replyId, (target) => ({
        ...target,
        reply: {
          ...target.reply,
          isLiked: result.isLiked,
          likeCount: result.likeCount,
        },
      }))
    } catch {
      qc.invalidateQueries({ queryKey })
    }
  }

  const handleDelete = () => {
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteReply({
        boardId: item.reply.boardId,
        replyId: item.reply.replyId,
      })
      syncReplyItem(item.reply.replyId, () => null)
    } catch {
      Alert.alert('오류', '댓글 삭제에 실패했어요.')
    }
  }

  const handleReport = () => {
    setReportModalVisible(true)
  }

  return (
    <>
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/feed/${item.reply.boardId}` as const)}
    >
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatarWrap}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <Image source={defaultProfileImage} style={styles.avatar} contentFit="cover" />
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.name}>{nickName}</Text>
            <Text style={styles.dot}> </Text>
            <Text style={styles.time}>{displayCreatedAt}</Text>
          </View>
        </View>

        <View style={styles.menuWrap}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              onToggleMenu()
            }}
            style={styles.menuButton}
          >
            <Image source={menuIcon} style={styles.menuIcon} contentFit="contain" />
          </Pressable>

          {isMenuOpen ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                onToggleMenu()
                if (isMine) handleDelete()
                else void handleReport()
              }}
              style={styles.dropdownButton}
            >
              <Image
                source={isMine ? deleteDropdown : commentDropdown}
                style={styles.dropdownImage}
                contentFit="contain"
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={styles.commentText}>{item.reply.comment}</Text>

      <View style={styles.actionRow}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation()
            void handleToggleLike()
          }}
          style={styles.likeButton}
        >
          <Image
            source={item.reply.isLiked ? likePinkIcon : likeIcon}
            style={styles.actionIcon}
            contentFit="contain"
          />
        </Pressable>

        {item.reply.likeCount > 0 ? <Text style={styles.count}>{item.reply.likeCount}</Text> : null}
      </View>
    </Pressable>
    <ReportModal
      visible={reportModalVisible}
      profileImageUrl={profileImageUrl}
      nickname={nickName}
      onClose={() => setReportModalVisible(false)}
      onConfirm={async () => {
        await reportReply({
          boardId: item.reply.boardId,
          replyId: item.reply.replyId,
          reportedUserId: item.reply.userId,
        })
      }}
    />
    <FeedDeleteConfirmModal
      type="comment"
      visible={deleteModalVisible}
      onClose={() => setDeleteModalVisible(false)}
      onConfirm={confirmDelete}
    />
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
    backgroundColor: C.card,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Gray[200],
  },
  avatar: {
    width: 32,
    height: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 1,
  },
  name: {
    ...Typography.body2Medium,
    color: Gray[900],
  },
  dot: {
    marginHorizontal: 4,
    ...Typography.body2Medium,
    color: Gray[300],
  },
  time: {
    ...Typography.body2Medium,
    color: Gray[300],
  },
  menuWrap: {
    position: 'relative',
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  dropdownButton: {
    position: 'absolute',
    right: 0,
    top: 28,
    zIndex: 12,
    borderRadius: 4,
    backgroundColor: C.card,
    shadowColor: C.text,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdownImage: {
    width: 96,
    height: 36,
  },
  commentText: {
    ...Typography.body2Medium,
    fontFamily: undefined,
    color: Gray[900],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  count: {
    marginLeft: 4,
    ...Typography.body2Bold,
    color: Gray[500],
  },
  pressed: {
    opacity: 0.9,
  },
})
