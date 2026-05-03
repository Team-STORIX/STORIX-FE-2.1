import { useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import type { ListRenderItemInfo } from 'react-native'
import type { TopicRoomItem } from '../../features/topicroom'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'
import { TopicRoomCoverCard } from './TopicRoomCoverCard'

type PlaceholderItem = {
  id: string
  kind: 'placeholder'
}

type CarouselItem = TopicRoomItem | PlaceholderItem

type TopicRoomCoverCarouselProps = {
  data?: TopicRoomItem[]
  isLoading?: boolean
  badgeLabel: string
  emptyText: string
  onPressItem: (room: TopicRoomItem) => void
}

const PLACEHOLDERS: PlaceholderItem[] = Array.from({ length: 3 }, (_, index) => ({
  id: `topicroom-placeholder-${index}`,
  kind: 'placeholder',
}))

function isPlaceholder(item: CarouselItem): item is PlaceholderItem {
  return 'kind' in item
}

export function TopicRoomCoverCarousel({
  data,
  isLoading = false,
  badgeLabel,
  emptyText,
  onPressItem,
}: TopicRoomCoverCarouselProps) {
  const { width: screenWidth } = useWindowDimensions()
  const [activeIndex, setActiveIndex] = useState(0)

  const cardWidth = Math.min(
    266,
    Math.max(220, screenWidth - S.screenH * 2 - 64),
  )
  const snapInterval = cardWidth + 12

  const items = useMemo<CarouselItem[]>(
    () => (isLoading ? PLACEHOLDERS : (data ?? [])),
    [data, isLoading],
  )

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.messageCard}>
        <Text style={styles.messageText}>{emptyText}</Text>
      </View>
    )
  }

  const renderItem = ({ item, index }: ListRenderItemInfo<CarouselItem>) => {
    if (isPlaceholder(item)) {
      return <TopicRoomCoverCard width={cardWidth} badgeLabel={badgeLabel} loading />
    }

    return (
      <View style={index === activeIndex ? undefined : styles.inactiveCard}>
        <TopicRoomCoverCard
          room={item}
          width={cardWidth}
          badgeLabel={badgeLabel}
          onPress={() => onPressItem(item)}
        />
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(item) =>
        isPlaceholder(item) ? item.id : `topicroom-${item.topicRoomId}`
      }
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      snapToInterval={snapInterval}
      decelerationRate="fast"
      snapToAlignment="start"
      disableIntervalMomentum
      onMomentumScrollEnd={(event) => {
        const nextIndex = Math.round(
          event.nativeEvent.contentOffset.x / snapInterval,
        )
        setActiveIndex(nextIndex)
      }}
    />
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: S.screenH,
  },
  separator: {
    width: 12,
  },
  inactiveCard: {
    opacity: 0.56,
  },
  messageCard: {
    marginHorizontal: S.screenH,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  messageText: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
})
