import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'
import type { WorksSearchItem } from '../api'
import { SearchEmptyState } from './SearchEmptyState'

const littleStarIcon = require('../../../../assets/icons/common/littleStar.svg')

type Props = {
  data: WorksSearchItem[]
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onEndReached: () => void
  onPressItem: (item: WorksSearchItem) => void
  recommendationKeyword?: string | null
  onPressRecommendation?: (keyword: string) => void
}

export function SearchWorksResultList({
  data,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
  onPressItem,
  recommendationKeyword,
  onPressRecommendation,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.message}>작품 검색 결과를 불러오지 못했어요.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `works-search-${item.worksId}`}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}
          onPress={() => onPressItem(item)}
          accessibilityRole="button"
        >
          <View style={styles.thumbnailWrap}>
            {item.thumbnailUrl ? (
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailFallback]} />
            )}
          </View>

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {item.worksName}
            </Text>

            <Text style={styles.meta} numberOfLines={1}>
              {item.artistName}
              {item.artistName && item.worksType ? ' · ' : ''}
              {item.worksType}
            </Text>

            <View style={styles.ratingRow}>
              <Image source={littleStarIcon} style={styles.star} contentFit="contain" />
              <Text style={styles.rating}>{Number(item.avgRating ?? 0).toFixed(1)}</Text>
            </View>
          </View>
        </Pressable>
      )}
      contentContainerStyle={data.length === 0 ? styles.emptyContent : undefined}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          onEndReached()
        }
      }}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <SearchEmptyState
          recommendationKeyword={recommendationKeyword}
          onPressRecommendation={onPressRecommendation}
        />
      }
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
    ...Typography.body2Medium,
    color: C.text,
  },
  meta: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  star: {
    width: 9,
    height: 10,
  },
  rating: {
    ...Typography.caption1Medium,
    color: C.primary,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  emptyContent: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
  },
  footerSpacer: {
    height: 88,
  },
  pressed: {
    opacity: 0.75,
  },
})
