import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { FavoriteWork } from '../types'
import { C, Gray, Magenta } from '../../../theme'

const favoriteCheckGrayIcon = require('../../../../assets/icons/common/check-gray.svg')
const favoriteCheckPinkIcon = require('../../../../assets/icons/common/check-pink.svg')

type Props = {
  item: FavoriteWork
  isFavorite: boolean
  showFavoriteButton?: boolean
  onToggleFavorite: (worksId: number) => void
}

function getWorksTypeLabel(worksType: string) {
  if (worksType === 'WEBTOON') return '웹툰'
  if (worksType === 'WEBNOVEL') return '웹소설'
  return worksType
}

export function ProfileLikedWorkItem({
  item,
  isFavorite,
  showFavoriteButton = true,
  onToggleFavorite,
}: Props) {
  const router = useRouter()
  const handlePress = () => {
    if (showFavoriteButton) {
      onToggleFavorite(item.worksId)
      return
    }

    router.push(`/works/${item.worksId}` as const)
  }
  const worksTypeLabel = getWorksTypeLabel(item.worksType)

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={
        showFavoriteButton
          ? `${item.worksName} ${'\uc120\ud0dd'}`
          : `${item.worksName} ${'\uc0c1\uc138\ub85c \uc774\ub3d9'}`
      }
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
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {item.artistName}
          </Text>
          <Text style={styles.metaDot}>{'\u00b7'}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {worksTypeLabel}
          </Text>
        </View>

        {item.isReviewed ? (
          <Text style={styles.reviewLabel}>{'\ud3c9\uac00\ud568'}</Text>
        ) : (
          <View style={styles.reviewSpacer} />
        )}
      </View>

      {showFavoriteButton ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation()
            onToggleFavorite(item.worksId)
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={'\uad00\uc2ec \uc791\ud488 \uc120\ud0dd'}
        >
          <Image
            source={isFavorite ? favoriteCheckPinkIcon : favoriteCheckGrayIcon}
            style={styles.favoriteIcon}
            contentFit="contain"
          />
        </Pressable>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 107,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontFamily: 'SUITSemiBold',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 19.6,
    color: '#000',
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  meta: {
    fontFamily: 'SUIT',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.8,
    color: Gray[500],
    flexShrink: 1,
  },
  metaDot: {
    marginHorizontal: 6,
    fontFamily: 'SUIT',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.8,
    color: Gray[500],
  },
  reviewLabel: {
    marginTop: 4,
    fontFamily: 'SUIT',
    fontWeight: '500',
    fontSize: 12,
    fontStyle: 'normal',
    lineHeight: 16.8,
    color: Magenta[300],
  },
  reviewSpacer: {
    marginTop: 4,
    height: 16.8,
  },
  favoriteButton: {
    width: 24,
    height: 24,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    width: 20,
    height: 20,
  },
  pressed: {
    opacity: 0.7,
  },
})
