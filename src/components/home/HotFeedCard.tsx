import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { TodayFeedItem } from '../../features/home'
import { Gray } from '../../theme/colors'
import { Typography } from '../../theme/typography'

const likeIcon = require('../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../assets/icons/common/icon-like-pink.svg')
const commentIcon = require('../../../assets/icons/common/icon-comment.svg')

type HotFeedCardProps = {
  item?: TodayFeedItem
  loading?: boolean
  onPress?: () => void
}

const CARD_W = 353
const CARD_H = 164

export function HotFeedCard({ item, loading = false, onPress }: HotFeedCardProps) {
  if (loading || !item) {
    return (
      <View style={[styles.card, styles.placeholderCard]}>
        <View style={styles.authorRow}>
          <View style={[styles.avatarWrap, styles.placeholderBlock]} />
          <View style={[styles.placeholderText, { width: 88 }]} />
        </View>
        <View style={styles.copy}>
          <View style={[styles.placeholderText, { width: '64%', height: 16 }]} />
          <View style={[styles.placeholderText, { width: '92%', height: 14, marginTop: 6 }]} />
        </View>
        <View style={styles.reactionRow}>
          <View style={[styles.placeholderText, { width: 36, height: 14 }]} />
          <View style={[styles.placeholderText, { width: 36, height: 14 }]} />
        </View>
      </View>
    )
  }

  const { board, profile } = item
  const raw = board.content ?? ''
  const title = raw.slice(0, 18) + (raw.length > 18 ? '...' : '')
  const preview =
    raw.length > 18
      ? raw.slice(18, 18 + 70) + (raw.length > 18 + 70 ? '...' : '')
      : ''

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
          {profile.profileImageUrl ? (
            <Image
              source={{ uri: profile.profileImageUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : null}
        </View>
        <Text style={styles.authorName} numberOfLines={1}>
          {profile.nickName ?? ''}
        </Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      </View>

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
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: Gray[200],
  },
  avatar: {
    width: 32,
    height: 32,
  },
  authorName: {
    ...Typography.body2Medium,
    color: '#000000',
    flexShrink: 1,
  },
  copy: {},
  title: {
    ...Typography.body1Medium,
    color: '#000000',
  },
  preview: {
    ...Typography.caption1Medium,
    color: Gray[500],
    minHeight: 32,
    marginTop: 4,
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
    width: 24,
    height: 24,
  },
  reactionCount: {
    ...Typography.caption1Medium,
    color: Gray[500],
    marginLeft: 4,
  },
})

