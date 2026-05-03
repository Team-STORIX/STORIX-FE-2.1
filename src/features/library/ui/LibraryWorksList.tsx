import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { C, Typography } from '../../../theme'
import type { LibraryUiWork } from './types'

const littleStarIcon = require('../../../../assets/icons/common/littleStar.svg')

type Props = {
  data: LibraryUiWork[]
  isFetchingNextPage?: boolean
  onEndReached?: () => void
  onPressItem: (item: LibraryUiWork) => void
}

export function LibraryWorksList({
  data,
  isFetchingNextPage = false,
  onEndReached,
  onPressItem,
}: Props) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `library-work-${item.id}`}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}
          onPress={() => onPressItem(item)}
          accessibilityRole="button"
        >
          <View style={styles.thumbnailWrap}>
            {item.thumb ? (
              <Image
                source={{ uri: item.thumb }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailFallback]} />
            )}
          </View>

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.meta}
            </Text>

            <View style={styles.ratingRow}>
              <Image source={littleStarIcon} style={styles.star} contentFit="contain" />
              <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </Pressable>
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  thumbnailWrap: {
    width: 87,
    height: 116,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: C.divider,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    backgroundColor: C.divider,
  },
  body: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
  },
  meta: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    width: 9,
    height: 10,
  },
  rating: {
    ...Typography.caption1Extrabold,
    color: C.primary,
  },
  footer: {
    paddingVertical: 16,
  },
  footerSpacer: {
    height: 32,
  },
  pressed: {
    opacity: 0.78,
  },
})
