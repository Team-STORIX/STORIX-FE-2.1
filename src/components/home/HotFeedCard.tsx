import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { TodayFeedItem } from '../../features/home'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'

const likeIcon = require('../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../assets/icons/common/icon-like-pink.svg')
const commentIcon = require('../../../assets/icons/common/icon-comment.svg')

type HotFeedCardProps = {
  item?: TodayFeedItem
  width: number
  loading?: boolean
  onPress?: () => void
}

export function HotFeedCard({
  item,
  width,
  loading = false,
  onPress,
}: HotFeedCardProps) {
  if (loading || !item) {
    return (
      <View style={[styles.card, styles.placeholderCard, { width }]}>
        <View style={styles.placeholderAuthorRow}>
          <View style={styles.placeholderAvatar} />
          <View style={styles.placeholderName} />
        </View>
        <View style={styles.placeholderTitle} />
        <View style={styles.placeholderBody} />
        <View style={styles.placeholderFooter}>
          <View style={styles.placeholderCount} />
          <View style={styles.placeholderCount} />
        </View>
      </View>
    )
  }

  const { board, profile } = item
  const rawContent = board.content.trim()
  const title = rawContent.slice(0, 18) + (rawContent.length > 18 ? '...' : '')
  const preview =
    rawContent.length > 18
      ? rawContent.slice(18, 88) + (rawContent.length > 88 ? '...' : '')
      : ''
  const initial = (profile.nickName || '?').slice(0, 1).toUpperCase()

  const cardContent = (
    <>
      <View style={styles.authorRow}>
        <View style={styles.avatarWrap}>
          {profile.profileImageUrl ? (
            <Image
              source={{ uri: profile.profileImageUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <Text style={styles.authorName} numberOfLines={1}>
          {profile.nickName}
        </Text>
      </View>

      <View style={styles.copyWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {board.isSpoiler ? '스포일러가 포함된 피드예요' : title || '오늘의 피드'}
        </Text>
        <Text
          style={[
            styles.preview,
            board.isSpoiler && styles.previewSpoiler,
          ]}
          numberOfLines={2}
        >
          {board.isSpoiler
            ? '작품 페이지에서 자세한 내용을 확인해 주세요.'
            : preview || rawContent}
        </Text>
      </View>

      <View style={styles.reactionRow}>
        <View style={styles.reactionItem}>
          <Image
            source={board.isLiked ? likePinkIcon : likeIcon}
            style={styles.reactionIcon}
            contentFit="contain"
          />
          <Text style={styles.reactionCount}>{board.likeCount}</Text>
        </View>
        <View style={styles.reactionItem}>
          <Image
            source={commentIcon}
            style={styles.reactionIcon}
            contentFit="contain"
          />
          <Text style={styles.reactionCount}>{board.replyCount}</Text>
        </View>
      </View>
    </>
  )

  if (!onPress) {
    return <View style={[styles.card, { width }]}>{cardContent}</View>
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {cardContent}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    height: 164,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.82,
  },
  placeholderCard: {
    justifyContent: 'space-between',
  },
  placeholderAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: C.divider,
  },
  placeholderName: {
    width: 88,
    height: 14,
    borderRadius: Radius.full,
    backgroundColor: C.divider,
  },
  placeholderTitle: {
    width: '70%',
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: C.divider,
  },
  placeholderBody: {
    width: '92%',
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: C.bg,
  },
  placeholderFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  placeholderCount: {
    width: 42,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: C.divider,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: C.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
  },
  avatarInitial: {
    ...Typography.caption1Extrabold,
    color: C.primary,
  },
  authorName: {
    ...Typography.body2Medium,
    color: C.text,
    flex: 1,
  },
  copyWrap: {
    gap: 4,
    minHeight: 54,
  },
  title: {
    ...Typography.body1Bold,
    color: C.text,
  },
  preview: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    minHeight: 34,
  },
  previewSpoiler: {
    color: C.primary,
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
    color: C.textMuted,
    marginLeft: 4,
  },
})
