import { useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import type { ReplyItem } from '../api/feed/readerBoardDetail.api'
import { formatCreatedAtLabel } from '../../../lib/utils/formatCreatedAtLabel'
import { LinkedText } from '../../../components/common/LinkedText'
import { OfficialMark } from '../../../components/common/OfficialMark'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'
import { FeedMenuDropdown, type MenuPosition } from './FeedMenuDropdown'

const likeIcon = require('../../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../../assets/icons/common/icon-like-pink.svg')
const commentIcon = require('../../../../assets/icons/common/icon-comment.svg')
const menuIcon = require('../../../../assets/icons/common/menu-3dots.svg')
const commentArrowIcon = require('../../../../assets/icons/feed/comment-arrow.svg')
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

type Props =
  | (BaseProps & {
      variant: 'reply'
      subReplyCount: number
      onReplyTo: () => void
      isReplyTarget?: boolean
    })
  | (BaseProps & { variant: 'subReply' })

export function FeedCommentItem(props: Props) {
  const { myUserId, writerUserId, item, isMenuOpen, onToggleMenu, onToggleLike, onOpenDelete, onOpenReport, onOpenBlock } =
    props
  const { reply, profile } = item
  const menuButtonRef = useRef<View | null>(null)
  const { width: screenWidth } = useWindowDimensions()
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 16 })
  const isMine = myUserId != null && reply.userId === myUserId
  const isWriter = writerUserId != null && reply.userId === writerUserId
  const isReply = props.variant === 'reply'
  const isReplyTarget = isReply && props.isReplyTarget

  const handleMenuPress = () => {
    if (isMenuOpen) {
      onToggleMenu()
      return
    }
    menuButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setMenuPosition({
        top: pageY + height + 4,
        right: Math.max(0, screenWidth - pageX - width - 8),
      })
      onToggleMenu()
    })
  }

  const card = (
    <View style={[isReply ? styles.replyCard : styles.subReplyInner, isReplyTarget && styles.replyCardHighlighted]}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatarWrap}>
            <Image
              source={profile.profileImageUrl ? { uri: profile.profileImageUrl } : defaultProfileImage}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.name, isWriter && styles.writerName]}>
              {profile.nickName}
              {isWriter ? <Text style={styles.writerBadge}>(글쓴이)</Text> : null}
            </Text>
            <OfficialMark role={profile.role} />
            <Text style={styles.dot}>·</Text>
            <Text style={styles.time}>{formatCreatedAtLabel(reply.lastCreatedTime)}</Text>
          </View>
        </View>

        <View style={styles.menuWrap}>
          <Pressable
            ref={menuButtonRef}
            onPress={handleMenuPress}
            style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
          >
            <Image source={menuIcon} style={styles.menuIcon} contentFit="contain" />
          </Pressable>
          <FeedMenuDropdown
            visible={isMenuOpen}
            position={menuPosition}
            isMine={isMine}
            onClose={onToggleMenu}
            onDelete={onOpenDelete}
            onReport={onOpenReport}
            onBlock={onOpenBlock}
          />
        </View>
      </View>

      <LinkedText style={styles.commentText}>{reply.comment}</LinkedText>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onToggleLike}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Image source={reply.isLiked ? likePinkIcon : likeIcon} style={styles.actionIcon} contentFit="contain" />
          {reply.likeCount > 0 ? (
            <Text style={[styles.count, reply.isLiked && styles.countLiked]}>{reply.likeCount}</Text>
          ) : null}
        </Pressable>

        {props.variant === 'reply' ? (
          <Pressable
            onPress={props.onReplyTo}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Image source={commentIcon} style={styles.actionIcon} contentFit="contain" />
            {props.subReplyCount > 0 ? <Text style={styles.count}>{props.subReplyCount}</Text> : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  )

  if (!isReply) {
    return (
      <View style={styles.subReplyRow}>
        <Image source={commentArrowIcon} style={styles.arrowIcon} contentFit="contain" />
        <View style={styles.subReplyCard}>{card}</View>
      </View>
    )
  }

  return card
}

const nameText = {
  fontFamily: 'SUITMedium',
  fontSize: 14,
  fontStyle: 'normal',
  fontWeight: '500',
  lineHeight: 19.6,
  color: Gray[900],
  textAlign: 'justify',
} as const

const styles = StyleSheet.create({
  replyCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
    backgroundColor: C.card,
  },
  replyCardHighlighted: {
    backgroundColor: C.primaryLight,
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
    ...nameText,
    flexShrink: 1,
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
  dot: {
    ...nameText,
    marginHorizontal: 4,
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
  actionButton: {
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
})
