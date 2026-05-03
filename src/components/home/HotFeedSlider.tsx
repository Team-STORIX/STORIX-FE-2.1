import { useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import type { ListRenderItemInfo } from 'react-native'
import type { TodayFeedItem } from '../../features/home'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'
import { HotFeedCard } from './HotFeedCard'

type PlaceholderItem = {
  id: string
  kind: 'placeholder'
}

type SliderItem = TodayFeedItem | PlaceholderItem

type HotFeedSliderProps = {
  data?: TodayFeedItem[]
  isLoading?: boolean
  onPressItem: (item: TodayFeedItem) => void
}

const PLACEHOLDERS: PlaceholderItem[] = Array.from({ length: 3 }, (_, index) => ({
  id: `feed-placeholder-${index}`,
  kind: 'placeholder',
}))

function isPlaceholder(item: SliderItem): item is PlaceholderItem {
  return 'kind' in item
}

export function HotFeedSlider({
  data,
  isLoading = false,
  onPressItem,
}: HotFeedSliderProps) {
  const listRef = useRef<FlatList<SliderItem>>(null)
  const { width: screenWidth } = useWindowDimensions()
  const [activeIndex, setActiveIndex] = useState(0)

  const cardWidth = Math.min(353, Math.max(280, screenWidth - S.screenH * 2))
  const snapInterval = cardWidth + S.itemGap
  const items = useMemo<SliderItem[]>(
    () => (isLoading ? PLACEHOLDERS : (data ?? [])),
    [data, isLoading],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [isLoading, data?.length])

  useEffect(() => {
    if (isLoading || !data || data.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = current >= data.length - 1 ? 0 : current + 1
        listRef.current?.scrollToOffset({
          offset: next * snapInterval,
          animated: true,
        })
        return next
      })
    }, 3500)

    return () => clearInterval(timer)
  }, [cardWidth, data, isLoading, snapInterval])

  const renderItem = ({ item, index }: ListRenderItemInfo<SliderItem>) => {
    if (isPlaceholder(item)) {
      return <HotFeedCard width={cardWidth} loading />
    }

    return (
      <View style={index === activeIndex ? undefined : styles.inactiveCard}>
        <HotFeedCard
          item={item}
          width={cardWidth}
          onPress={() => onPressItem(item)}
        />
      </View>
    )
  }

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.messageCard}>
        <Text style={styles.messageText}>오늘의 피드가 아직 없어요.</Text>
      </View>
    )
  }

  return (
    <FlatList
      ref={listRef}
      data={items}
      horizontal
      keyExtractor={(item) =>
        isPlaceholder(item) ? item.id : `feed-${item.board.boardId}`
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
      getItemLayout={(_, index) => ({
        length: snapInterval,
        offset: snapInterval * index,
        index,
      })}
    />
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: S.screenH,
  },
  separator: {
    width: S.itemGap,
  },
  inactiveCard: {
    opacity: 0.58,
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
