import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { TodayFeedItem } from '../../features/home'
import { Gray } from '../../theme/colors'
import { Typography } from '../../theme/typography'
import { HotFeedCard } from './HotFeedCard'

const HOME_PAD = 16
const ITEM_GAP = 8
const SKELETON_COUNT = 5

type HotFeedSliderProps = {
  data?: TodayFeedItem[]
  isLoading?: boolean
  onPressItem: (item: TodayFeedItem) => void
}

export function HotFeedSlider({
  data,
  isLoading = false,
  onPressItem,
}: HotFeedSliderProps) {
  if (!isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.messageCard}>
        <Text style={styles.messageText}>오늘의 피드가 아직 없어요.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {isLoading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <View
              key={`skeleton-${i}`}
              style={i === 0 ? undefined : styles.gap}
            >
              <HotFeedCard loading />
            </View>
          ))
        : (data ?? []).map((item, i) => (
            <View
              key={`feed-${item.board.boardId}`}
              style={i === 0 ? undefined : styles.gap}
            >
              <HotFeedCard item={item} onPress={() => onPressItem(item)} />
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
