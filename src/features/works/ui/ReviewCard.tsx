import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useLikesStore } from '../../../store/likes.store'
import type { WorksReviewItem } from '../api/worksReview.schema'
import { C } from '../../../theme/colors'

type Props = {
  item: WorksReviewItem
  onLike: (reviewId: number) => void
  isLiking: boolean
}

export function ReviewCard({ item, onLike, isLiking }: Props) {
  // Read optimistic like state from store ??updates instantly on tap.
  const isLiked = useLikesStore((s) => !!s.likedIds[String(item.reviewId)])
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)

  const isSpoiler = item.isSpoiler === true
  const showSpoilerPlaceholder = isSpoiler && !spoilerRevealed

  const initial = ((item.userName ?? '?')[0]).toUpperCase()

  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          {item.profileImageUrl ? (
            <Image
              source={{ uri: item.profileImageUrl }}
              style={styles.avatarImg}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>

        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{item.userName ?? '?듬챸'}</Text>
          {item.rating != null ? (
            <Text style={styles.ratingText}>??{item.rating.toFixed(1)}</Text>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {showSpoilerPlaceholder ? (
        <Pressable
          style={styles.spoilerBox}
          onPress={() => setSpoilerRevealed(true)}
          accessibilityRole="button"
          accessibilityLabel="?ㅽ룷?쇰윭 ?댁슜 蹂닿린"
        >
          <Text style={styles.spoilerLabel}>?ㅽ룷?쇰윭 ?ы븿</Text>
          <Text style={styles.spoilerHint}>??븯???댁슜 蹂닿린</Text>
        </Pressable>
      ) : (
        <View>
          {isSpoiler ? (
            <View style={styles.spoilerRevealedBadge}>
              <Text style={styles.spoilerRevealedText}>?ㅽ룷?쇰윭</Text>
            </View>
          ) : null}
          <Text style={styles.content} numberOfLines={5}>
            {item.content ?? ''}
          </Text>
        </View>
      )}

      {/* Footer: like button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.likeBtn,
            (pressed || isLiking) && styles.likeBtnPressed,
          ]}
          onPress={() => onLike(item.reviewId)}
          disabled={isLiking}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? '醫뗭븘??痍⑥냼' : '醫뗭븘??'}
        >
          <Text style={[styles.likeIcon, isLiked && styles.likeIconActive]}>
            {isLiked ? '??' : '??'}
          </Text>
          <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
            {item.likeCount ?? 0}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const AVATAR_SIZE = 36
const CARD_RADIUS = 12

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarInitial: { fontSize: 15, fontWeight: '700', color: C.primary },
  authorMeta: { flex: 1 },
  authorName: { fontSize: 13, fontWeight: '600', color: C.text },
  ratingText: { fontSize: 12, color: C.star, marginTop: 1 },

  content: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },

  spoilerBox: {
    backgroundColor: C.spoilerBg,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  spoilerLabel: { fontSize: 13, fontWeight: '700', color: C.primary },
  spoilerHint: { fontSize: 11, color: C.textMuted, marginTop: 3 },

  spoilerRevealedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  spoilerRevealedText: { fontSize: 10, fontWeight: '600', color: C.primary },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  likeBtnPressed: { opacity: 0.6 },
  likeIcon: { fontSize: 14, color: C.textMuted },
  likeIconActive: { color: C.liked },
  likeCount: { fontSize: 12, color: C.textMuted },
  likeCountActive: { color: C.liked, fontWeight: '600' },
})
