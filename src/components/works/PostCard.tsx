import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useLikesStore } from '../../store/likes.store'
import type { WorksReviewItem } from '../../features/works'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'
import { StarRating } from '../common/StarRating'

const likeIcon = require('../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../assets/icons/common/icon-like-pink.svg')

type PostCardProps = {
  item: WorksReviewItem
  onLike: (reviewId: number) => void
  isLiking?: boolean
}

export function PostCard({ item, onLike, isLiking = false }: PostCardProps) {
  const isLiked = useLikesStore((state) => !!state.likedIds[String(item.reviewId)])
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  const isHidden = item.isSpoiler === true && !spoilerRevealed
  const initial = (item.userName ?? '유').slice(0, 1).toUpperCase()

  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          {item.profileImageUrl ? (
            <Image
              source={{ uri: item.profileImageUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <Text style={styles.authorName}>{item.userName ?? '익명'}</Text>
      </View>

      <Pressable
        style={styles.contentButton}
        onPress={() => {
          if (isHidden) setSpoilerRevealed(true)
        }}
        disabled={!isHidden}
      >
        <View style={styles.contentWrap}>
          <Text
            style={[styles.content, isHidden && styles.contentHidden]}
            numberOfLines={3}
          >
            {item.content ?? ''}
          </Text>
          {isHidden ? (
            <View style={styles.spoilerOverlay}>
              <Text style={styles.spoilerText}>
                스포일러가 포함된 리뷰예요. 탭해서 확인해 주세요.
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.metaRow}>
        <View style={styles.ratingBox}>
          <StarRating value={item.rating ?? 0} size={16} showValue />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.likePill,
            (pressed || isLiking) && styles.pressed,
          ]}
          onPress={() => onLike(item.reviewId)}
          disabled={isLiking}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? '리뷰 좋아요 취소' : '리뷰 좋아요'}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <>
              <Image
                source={isLiked ? likePinkIcon : likeIcon}
                style={styles.likeIcon}
                contentFit="contain"
              />
              <Text style={styles.likeCount}>{item.likeCount ?? 0}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.divider,
  },
  avatarImage: {
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
  },
  contentButton: {
    marginBottom: 16,
  },
  contentWrap: {
    position: 'relative',
    minHeight: 64,
    justifyContent: 'center',
  },
  content: {
    ...Typography.body2Medium,
    color: C.textSecondary,
    paddingRight: 4,
  },
  contentHidden: {
    opacity: 0.14,
  },
  spoilerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  spoilerText: {
    ...Typography.caption1Medium,
    color: C.primary,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBox: {
    flex: 1,
    marginRight: 12,
  },
  likePill: {
    minWidth: 68,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: C.card,
    shadowColor: C.text,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  likeIcon: {
    width: 16,
    height: 16,
  },
  likeCount: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
})
