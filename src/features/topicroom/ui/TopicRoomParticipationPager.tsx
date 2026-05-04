import { useMemo, useState } from 'react'
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native'
import type { TopicRoomItem } from '../api/topicroom.schema'
import { C } from '../../../theme/colors'
import { TopicRoomListItem } from './TopicRoomListItem'

const ITEMS_PER_PAGE = 3

type Props = {
  items: TopicRoomItem[]
  onPressItem: (item: TopicRoomItem) => void
}

export function TopicRoomParticipationPager({ items, onPressItem }: Props) {
  const { width } = useWindowDimensions()
  const pages = useMemo(() => {
    const next: TopicRoomItem[][] = []
    for (let index = 0; index < items.length; index += ITEMS_PER_PAGE) {
      next.push(items.slice(index, index + ITEMS_PER_PAGE))
    }
    return next
  }, [items])

  const [pageIndex, setPageIndex] = useState(0)

  if (pages.length === 0) return null

  return (
    <View style={styles.wrap}>
      <FlatList
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `page-${index}`}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            {item.map((room) => (
              <View key={room.topicRoomId} style={styles.itemRow}>
                <TopicRoomListItem
                  item={{ ...room, isJoined: true }}
                  onPress={() => onPressItem({ ...room, isJoined: true })}
                />
              </View>
            ))}
          </View>
        )}
        onMomentumScrollEnd={(event) => {
          const nextPage = Math.round(
            event.nativeEvent.contentOffset.x /
              Math.max(1, event.nativeEvent.layoutMeasurement.width),
          )
          setPageIndex(nextPage)
        }}
      />

      {pages.length >= 1 ? (
        <View style={styles.indicatorRow}>
          {pages.map((_, index) => (
            <View
              key={`indicator-${index}`}
              style={[
                styles.indicatorDot,
                index === pageIndex && styles.indicatorDotActive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  page: {
    gap: 16,
  },
  itemRow: {
    width: '100%',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.border,
  },
  indicatorDotActive: {
    backgroundColor: C.primary,
  },
})
