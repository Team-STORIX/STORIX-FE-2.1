import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Typography } from '../../../theme'
import { LibraryRatingBadge } from './LibraryRatingBadge'
import type { LibraryUiWork } from './types'

type Props = {
  data: LibraryUiWork[]
  bottomInset?: number
  isFetchingNextPage?: boolean
  onEndReached?: () => void
  onPressItem: (item: LibraryUiWork) => void
}

export function LibraryWorksList({
  data,
  bottomInset = 128,
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

            <LibraryRatingBadge value={item.rating} />
          </View>
        </Pressable>
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={[styles.footer, { paddingBottom: bottomInset }]}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <View style={{ height: bottomInset }} />
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
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
    justifyContent: 'flex-start',
  },
  title: {
    ...Typography.body2Medium,
    color: Gray[900],
  },
  meta: {
    ...Typography.caption1Medium,
    color: Gray[500],
  },
  footer: {
    paddingTop: 16,
  },
  pressed: {
    opacity: 0.78,
  },
})
