import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { Typography } from '../../../theme/typography'
import { formatTimeAgo } from '../../../lib/utils/formatTimeAgo'
import type { TopicRoomSearchItem } from '../api'

function formatTopicRoomSubtitle(
  worksType?: string | null,
  worksName?: string | null,
) {
  const rawType = (worksType ?? '').trim()
  const type =
    rawType === 'WEBTOON'
      ? '웹툰'
      : rawType === 'WEBNOVEL'
        ? '웹소설'
        : rawType || '작품'

  return `${type} <${(worksName ?? '').trim()}>`
}

type Props = {
  keyword: string
  data: TopicRoomSearchItem[]
  isLoading: boolean
  isError: boolean
  isJoining: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onEndReached: () => void
  onPressItem: (item: TopicRoomSearchItem) => void
}

function EmptyState({ keyword }: { keyword: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>검색 결과가 없어요.</Text>
      <Text style={styles.emptyBody}>
        "{keyword}"에 맞는 토픽룸을 찾지 못했어요.
      </Text>
    </View>
  )
}

export function SearchTopicRoomResultList({
  keyword,
  data,
  isLoading,
  isError,
  isJoining,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
  onPressItem,
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
        <Text style={styles.message}>토픽룸 검색 결과를 불러오지 못했어요.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `topicroom-search-${item.topicRoomId}`}
      contentContainerStyle={data.length === 0 ? styles.emptyContent : styles.content}
      renderItem={({ item }) => {
        const subtitle = formatTopicRoomSubtitle(item.worksType, item.worksName)
        const timeAgo = formatTimeAgo(item.lastChatTime)
        const rightText = timeAgo
          ? `${item.activeUserNumber ?? 0}명 · ${timeAgo}`
          : `${item.activeUserNumber ?? 0}명`
        const initial = (item.worksName || item.topicRoomName || '?')
          .slice(0, 1)
          .toUpperCase()

        return (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => onPressItem(item)}
            disabled={isJoining}
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
                <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                  <Text style={styles.thumbnailFallbackText}>{initial}</Text>
                </View>
              )}
            </View>

            <View style={styles.body}>
              <View style={styles.topRow}>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
                <Text style={styles.rightText}>{rightText}</Text>
              </View>

              <Text style={styles.title} numberOfLines={1}>
                {item.topicRoomName}
              </Text>
            </View>
          </Pressable>
        )
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          onEndReached()
        }
      }}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState keyword={keyword} />}
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: C.divider,
    flexShrink: 0,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryLight,
  },
  thumbnailFallbackText: {
    ...Typography.body1Bold,
    color: C.primary,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  subtitle: {
    ...Typography.body2Medium,
    color: C.text,
    flex: 1,
  },
  rightText: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  title: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  separator: {
    height: 16,
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
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  emptyTitle: {
    ...Typography.body1Semibold,
    color: C.text,
    marginBottom: 6,
  },
  emptyBody: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
  },
  footerSpacer: {
    height: 32,
  },
  pressed: {
    opacity: 0.75,
  },
})
