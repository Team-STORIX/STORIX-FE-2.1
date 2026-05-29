import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { FavoriteWork } from '../types'
import { C, Gray, Magenta, Typography } from '../../../theme'

const favoriteOnIcon = require('../../../../assets/icons/profile/likes-check.svg')
const favoriteOffIcon = require('../../../../assets/icons/profile/likes-plus.svg')
const ratingStarIcon = require('../../../../assets/icons/common/star.svg')

type Props = {
  item: FavoriteWork
  isFavorite: boolean
  onToggleFavorite: (worksId: number) => void
}

export function ProfileLikedWorkItem({ item, isFavorite, onToggleFavorite }: Props) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push(`/works/${item.worksId}` as const)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.worksName} ${'\uc0c1\uc138\ub85c \uc774\ub3d9'}`}
    >
      <View style={styles.thumbnailWrap}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.worksName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.artistName} {'\u00b7'} {item.worksType}
        </Text>

        {item.isReviewed ? (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{'\ud3c9\uac00\ud568'}</Text>
            <Image source={ratingStarIcon} style={styles.starIcon} contentFit="contain" />
            <Text style={styles.ratingText}>{item.rating ?? '-'}</Text>
          </View>
        ) : (
          <View style={styles.reviewSpacer} />
        )}
      </View>

      <Pressable
        onPress={(event) => {
          event.stopPropagation()
          onToggleFavorite(item.worksId)
        }}
        hitSlop={8}
        style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={'\uad00\uc2ec \uc791\ud488 \ud1a0\uae00'}
      >
        <Image
          source={isFavorite ? favoriteOnIcon : favoriteOffIcon}
          style={styles.favoriteIcon}
          contentFit="contain"
        />
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 107,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
  },
  thumbnailWrap: {
    width: 62,
    height: 83,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Gray[200],
  },
  thumbnail: {
    width: 62,
    height: 83,
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
  },
  meta: {
    marginTop: 4,
    ...Typography.body2Medium,
    color: Gray[500],
  },
  reviewRow: {
    marginTop: 4,
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewLabel: {
    ...Typography.caption1Medium,
    letterSpacing: 0.2,
    color: Magenta[300],
  },
  starIcon: {
    width: 9,
    height: 10,
    marginLeft: 6,
  },
  ratingText: {
    marginLeft: 2,
    ...Typography.caption2Medium,
    color: Magenta[300],
  },
  reviewSpacer: {
    marginTop: 4,
    height: 14,
  },
  favoriteButton: {
    width: 24,
    height: 24,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.7,
  },
})
