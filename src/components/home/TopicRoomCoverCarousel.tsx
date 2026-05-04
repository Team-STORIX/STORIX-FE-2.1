import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import type { TopicRoomItem } from '../../features/topicroom'
import { Gray } from '../../theme/colors'
import { Typography } from '../../theme/typography'
import {
  TOPICROOM_CARD_W,
  TopicRoomCoverCard,
} from './TopicRoomCoverCard'

const HOME_PAD = 16
const ITEM_GAP = 12
const SKELETON_COUNT = 3

type TopicRoomCoverCarouselProps = {
  data?: TopicRoomItem[]
  isLoading?: boolean
  badgeLabel?: string
  emptyText: string
  onPressItem: (room: TopicRoomItem) => void
}

export function TopicRoomCoverCarousel({
  data,
  isLoading = false,
  badgeLabel = 'HOT',
  emptyText,
  onPressItem,
}: TopicRoomCoverCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.messageCard}>
        <Text style={styles.messageText}>{emptyText}</Text>
      </View>
    )
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x
    const idx = Math.round(x / (TOPICROOM_CARD_W + ITEM_GAP))
    if (idx !== activeIdx) setActiveIdx(idx)
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      decelerationRate="fast"
      snapToInterval={TOPICROOM_CARD_W + ITEM_GAP}
      snapToAlignment="start"
      disableIntervalMomentum
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {isLoading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <View
              key={`tr-skeleton-${i}`}
              style={[i === 0 ? undefined : styles.gap]}
            >
              <TopicRoomCoverCard loading badgeLabel={badgeLabel} />
            </View>
          ))
        : (data ?? []).map((room, i) => (
            <View
              key={`topicroom-${room.topicRoomId}`}
              style={[
                i === 0 ? undefined : styles.gap,
                i === activeIdx ? null : styles.inactive,
              ]}
            >
              <TopicRoomCoverCard
                room={room}
                badgeLabel={badgeLabel}
                onPress={() => onPressItem(room)}
              />
            </View>
          ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -HOME_PAD,
  },
  content: {
    paddingHorizontal: HOME_PAD,
  },
  gap: {
    marginLeft: ITEM_GAP,
  },
  inactive: {
    opacity: 0.5,
  },
  messageCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Gray[100],
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  messageText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
})
