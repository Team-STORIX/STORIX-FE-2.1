import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { TodayFeedItem } from '../../features/home'
import { C, Gray } from '../../theme/colors'
import { Typography } from '../../theme/typography'

const likeIcon = require('../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../assets/icons/common/icon-like-pink.svg')
const commentIcon = require('../../../assets/icons/common/icon-comment.svg')
const defaultProfileImage = require('../../../assets/placeholders/profile-default.png')

type HotFeedCardProps = {
  item?: TodayFeedItem
  loading?: boolean
  onPress?: () => void
}

const CARD_W = 353
const CARD_H = 140

export function HotFeedCard({ item, loading = false, onPress }: HotFeedCardProps) {
  if (loading || !item) {
    return (
      <View style={[styles.card, styles.placeholderCard]}>
        <View style={styles.authorRow}>
          <View style={[styles.avatarWrap, styles.placeholderBlock]} />
          <View style={[styles.placeholderText, { width: 88 }]} />
        </View>
        <View style={[styles.placeholderText, styles.placeholderContent]} />
        <View style={[styles.placeholderText, styles.placeholderContentShort]} />
        <View style={styles.reactionRow}>
          <View style={[styles.placeholderText, { width: 36, height: 14 }]} />
          <View style={[styles.placeholderText, { width: 36, height: 14 }]} />
        </View>
      </View>
    )
  }

  const { board, profile } = item
  const content = board.content ?? ''

  const Wrapper: any = onPress ? Pressable : View
  const wrapperProps = onPress
    ? {
        onPress,
        accessibilityRole: 'button' as const,
        style: ({ pressed }: { pressed: boolean }) => [
          styles.card,
          pressed && styles.cardPressed,
        ],
      }
    : { style: styles.card }

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.authorRow}>
        <View style={styles.avatarWrap}>
          <Image
            source={
              profile.profileImageUrl
                ? { uri: profile.profileImageUrl }
                : defaultProfileImage
            }
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
        <Text style={styles.authorName} numberOfLines={1}>
          {profile.nickName ?? ''}
        </Text>
      </View>

      <Text style={styles.contentText} numberOfLines={2}>
        {content}
      </Text>

      <View style={styles.reactionRow}>
        <View style={styles.reactionItem}>
          <Image
            source={board.isLiked ? likePinkIcon : likeIcon}
            style={styles.reactionIcon}
            contentFit="contain"
          />
          <Text style={styles.reactionCount}>{board.likeCount ?? 0}</Text>
        </View>
        <View style={styles.reactionItem}>
          <Image
            source={commentIcon}
            style={styles.reactionIcon}
            contentFit="contain"
          />
          <Text style={styles.reactionCount}>{board.replyCount ?? 0}</Text>
        </View>
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Gray[100],
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  cardPressed: {
    opacity: 0.85,
  },
  placeholderCard: {
    backgroundColor: Gray[100],
    borderColor: Gray[100],
  },
  placeholderBlock: {
    backgroundColor: Gray[200],
  },
  placeholderText: {
    height: 12,
    borderRadius: 4,
    backgroundColor: Gray[200],
  },
  placeholderContent: {
    width: '92%',
    height: 14,
    marginTop: 2,
  },
  placeholderContentShort: {
    width: '76%',
    height: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: Gray[200],
  },
  avatar: {
    width: 20,
    height: 20,
  },
  authorName: {
    ...Typography.body2Medium,
    color: C.text,
    flexShrink: 1,
  },
  contentText: {
    ...Typography.caption1Medium,
    color: Gray[500],
    minHeight: 34,
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionIcon: {
    width: 20,
    height: 20,
  },
  reactionCount: {
    ...Typography.caption1Medium,
    color: Gray[500],
    marginLeft: 4,
  },
})
