import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { FavoriteArtist } from '../types'
import { C, Gray, Radius, Typography } from '../../../theme'

const favoriteOnIcon = require('../../../../assets/icons/profile/likes-check.svg')
const favoriteOffIcon = require('../../../../assets/icons/profile/likes-plus.svg')
const defaultProfileImage = require('../../../../assets/icons/profile/profile-default.svg')

type Props = {
  item: FavoriteArtist
  isFavorite: boolean
  onToggleFavorite: (artistId: number) => void
}

export function ProfileLikedWriterItem({ item, isFavorite, onToggleFavorite }: Props) {
  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          '\uc548\ub0b4',
          '\uc791\uac00 \uc0c1\uc138 \ud654\uba74\uc740 \uc544\uc9c1 \uc900\ube44 \uc911\uc774\uc5d0\uc694.',
        )
      }
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.artistName} ${'\ud56d\ubaa9'}`}
    >
      <Image
        source={item.profileImageUrl ? { uri: item.profileImageUrl } : defaultProfileImage}
        style={styles.avatar}
        contentFit="cover"
      />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.artistName}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {item.profileDescription}
        </Text>
      </View>

      <Pressable
        onPress={(event) => {
          event.stopPropagation()
          onToggleFavorite(item.artistId)
        }}
        hitSlop={8}
        style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={'\uad00\uc2ec \uc791\uac00 \ud1a0\uae00'}
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
    minHeight: 88,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Gray[200],
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  name: {
    ...Typography.body1Medium,
    color: C.text,
  },
  description: {
    marginTop: 4,
    ...Typography.caption1Medium,
    color: Gray[500],
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
