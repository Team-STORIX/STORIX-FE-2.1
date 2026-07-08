import { FlatList, StyleSheet, View } from 'react-native'
import type { TopicRoomItem } from '../api/topicroom.schema'
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
      contentContainerStyle={[
        styles.content,
        data.length === 0 ? styles.emptyContent : null,
      ]}
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

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyContent: {
    flexGrow: 1,
  },
  item: {
    width: '100%',
  },
  separator: {
    height: 16,
  },
})
