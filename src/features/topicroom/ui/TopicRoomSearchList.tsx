import { FlatList, StyleSheet, Text, View } from 'react-native'
import type { TopicRoomItem } from '../api/topicroom.schema'
import { C } from '../../../theme/colors'
import { S } from '../../../theme/spacing'
import { Typography } from '../../../theme/typography'
import { TopicRoomListItem } from './TopicRoomListItem'

type Props = {
  data: TopicRoomItem[]
  onPressItem: (item: TopicRoomItem) => void
  onEndReached: () => void
  footer?: React.ReactElement | null
  empty?: React.ReactElement | null
}

export function TopicRoomSearchList({
  data,
  onPressItem,
  onEndReached,
  footer = null,
  empty = null,
}: Props) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `search-${item.topicRoomId}`}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <TopicRoomListItem item={item} onPress={() => onPressItem(item)} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  )
}

export function TopicRoomSearchEmpty({ keyword }: { keyword: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>검색 결과 없음</Text>
      <Text style={styles.emptyText}>"{keyword}"와 일치하는 토픽룸이 없어요.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  item: {
    width: '100%',
  },
  separator: {
    height: 16,
  },
  emptyWrap: {
    paddingHorizontal: 32,
    paddingTop: 96,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.body1Semibold,
    color: C.text,
    marginBottom: 6,
  },
  emptyText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
})
