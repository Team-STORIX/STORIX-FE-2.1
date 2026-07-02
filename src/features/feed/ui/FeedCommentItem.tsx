import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { ReplyItem } from '../api/feed/readerBoardDetail.api'
import { formatCreatedAtLabel } from '../../../lib/utils/formatCreatedAtLabel'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'

const likeIcon = require('../../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../../assets/icons/common/icon-like-pink.svg')
const commentIcon = require('../../../../assets/icons/common/icon-comment.svg')
const menuIcon = require('../../../../assets/icons/common/menu-3dots.svg')
const commentArrowIcon = require('../../../../assets/icons/feed/comment-arrow.svg')
const commentDropdown = require('../../../../assets/icons/common/comment-dropdown.svg')
const deleteDropdown = require('../../../../assets/icons/common/delete-dropdown.svg')
const defaultProfileImage = require('../../../../assets/placeholders/profile-default.png')

type BaseProps = {
  myUserId: number | null
  writerUserId?: number
  item: ReplyItem
  isMenuOpen: boolean
  onToggleMenu: () => void
  onToggleLike: () => void
  onOpenDelete: () => void
  onOpenReport: () => void
  onOpenBlock: () => void
}

type ReplyProps = BaseProps & {
  variant: 'reply'
  subReplyCount: number
  onReplyTo: () => void
  isReplyTarget?: boolean
}

type SubReplyProps = BaseProps & {
  variant: 'subReply'
}

type Props = ReplyProps | SubReplyProps

export function FeedCommentItem(props: Props) {
  const { myUserId, writerUserId, item, isMenuOpen, onToggleMenu, onToggleLike, onOpenDelete, onOpenReport, onOpenBlock } =
    props
  const isMine = myUserId != null && item.reply.userId === myUserId
  const isWriter = writerUserId != null && item.reply.userId === writerUserId
  const isReplyTarget = props.variant === 'reply' && props.isReplyTarget
  const displayCreatedAt = formatCreatedAtLabel(item.reply.lastCreatedTime)

  const card = (
    <View style={[
      props.variant === 'reply' ? styles.replyCard : styles.subReplyInner,
      isReplyTarget && styles.replyCardHighlighted,
    ]}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatarWrap}>
            <Image
              source={item.profile.profileImageUrl ? { uri: item.profile.profileImageUrl } : defaultProfileImage}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.name, isWriter && styles.writerName]}>{item.profile.nickName}{isWriter ? <Text style={styles.writerBadge}>(글쓴이)</Text> : null}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.time}>{displayCreatedAt}</Text>
          </View>
        </View>

        <View style={styles.menuWrap}>
          <Pressable
            onPress={onToggleMenu}
            style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
          >
            <Image source={menuIcon} style={styles.menuIcon} contentFit="contain" />
          </Pressable>

          {isMenuOpen ? (
            <View style={styles.dropdownButton}>
              {isMine ? (
                <View style={styles.menuTextWrapper}>
                  <Pressable
                    style={styles.menuTextItem}
                    onPress={() => {
                      onToggleMenu()
                      onOpenDelete()
                    }}
                  >
                    <Text style={styles.menuTextItemText}>삭제하기</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.menuTextWrapper}>
                  {/* 신고하기 */}
                  <Pressable
                    style={styles.menuTextItem}
                    onPress={() => {
                      onToggleMenu()
                      onOpenReport()
                    }}
                  >
                    <Text style={styles.menuTextItemText}>신고하기</Text>
                  </Pressable>
                  {/* 구분선 */}
                  <View style={styles.menuDivider} />
                  {/* 차단하기 */}
                  <Pressable
                    style={styles.menuTextItem}
                    onPress={() => {
                      onToggleMenu()
                      onOpenBlock()
                    }}
                  >
                    <Text style={styles.menuTextItemText}>차단하기</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.commentText}>{item.reply.comment}</Text>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onToggleLike}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Image
            source={item.reply.isLiked ? likePinkIcon : likeIcon}
            style={styles.actionIcon}
            contentFit="contain"
          />
          {item.reply.likeCount > 0 ? (
            <Text style={[styles.count, item.reply.isLiked ? styles.countLiked : null]}>
              {item.reply.likeCount}
            </Text>
          ) : null}
        </Pressable>

        {props.variant === 'reply' ? (
          <Pressable
            onPress={props.onReplyTo}
            style={({ pressed }) => [styles.replyButton, pressed && styles.pressed]}
          >
            <Image source={commentIcon} style={styles.actionIcon} contentFit="contain" />
            {props.subReplyCount > 0 ? <Text style={styles.count}>{props.subReplyCount}</Text> : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  )

  if (props.variant === 'subReply') {
    return (
      <View style={styles.subReplyRow}>
        <Image source={commentArrowIcon} style={styles.arrowIcon} contentFit="contain" />
        <View style={styles.subReplyCard}>{card}</View>
      </View>
    )
  }

  return card
}

const styles = StyleSheet.create({
  replyCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
    backgroundColor: C.card,
  },
  subReplyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 20,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: C.card,
  },
  arrowIcon: {
    width: 14,
    height: 14,
    marginTop: 3,
  },
  subReplyCard: {
    flex: 1,
    marginLeft: 12,
    borderRadius: Radius.sm,
    backgroundColor: Gray[50],
  },
  subReplyInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  menuTextWrapper: {
    width: 96,
    padding: 8,
  },
  menuTextItem: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuTextItemText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  menuDivider: {
    height: 1,
    backgroundColor: Gray[200],
    marginVertical: 6,
  },
  commentText: {
    ...Typography.body2Medium,
    fontFamily: undefined,
    marginTop: 12,
    color: Gray[900],
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  count: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'justify',
  },
  countLiked: {
    color: Magenta[300],
  },
  pressed: {
    opacity: 0.7,
  },
  writerName: {
    color: C.primary,
    fontWeight: '700',
    lineHeight: 19.6,
  },
  writerBadge: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19.6,
    color: C.primary,
  },
  replyCardHighlighted: {
    backgroundColor: C.primaryLight,
  },
})
