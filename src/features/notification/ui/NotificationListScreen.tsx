import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { C } from '../../../theme'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
} from '../hooks'
import type { NotificationItem } from '../api/notification.schema'
import { NotificationHeader } from './NotificationHeader'
import { NotificationMenu } from './NotificationMenu'
import { NotificationListItem } from './NotificationListItem'
import { NotificationEmptyState } from './NotificationEmptyState'
import type { PushRoute } from '../services/pushPayload'
import {
  getAppEventWebViewRoute,
  getValidHttpUrl,
} from '../../app-event/lib/targetNavigation'
import { getTopicRoomChatRoute } from '../../topicroom/services/topicRoomNavigation'

function isValidId(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/** Resolves the in-app destination for a tapped notification. */
function resolveTarget(
  item: NotificationItem,
): PushRoute | null {
  const targetType = (item.targetType ?? '').toUpperCase()
  const notificationType = (item.notificationType ?? '').toUpperCase()
  const category = (item.category ?? '').toUpperCase()
  const targetKey = `${targetType} ${notificationType} ${category}`
  const targetId = isValidId(item.targetId) ? item.targetId : null
  const eventId = isValidId(item.eventId) ? item.eventId : null
  const parentTargetId = isValidId(item.parentTargetId) ? item.parentTargetId : null

  // NONE notifications are informational: tapping them only marks them read.
  if (targetType === 'NONE' && eventId == null) return null

  if (targetType === 'APP_EVENT' || eventId != null) {
    const appEventId = eventId ?? targetId
    return getAppEventWebViewRoute(appEventId, item.title)
  }

  if (targetType === 'EXTERNAL') {
    return getValidHttpUrl(item.targetLink)
  }

  if (targetKey.includes('COMMENT') || targetKey.includes('REPLY')) {
    if (parentTargetId != null) {
      return targetId != null
        ? { pathname: `/feed/${parentTargetId}`, params: { commentId: targetId } }
        : `/feed/${parentTargetId}`
    }
    if (targetId != null && targetType.includes('FEED')) return `/feed/${targetId}`
  }

  if (targetId != null) {
    if (targetKey.includes('FEED')) return `/feed/${targetId}`
    if (targetKey.includes('REVIEW')) return `/works/review/${targetId}`
    if (targetKey.includes('WORKS')) return `/works/${targetId}`
    if (targetKey.includes('TOPIC')) return getTopicRoomChatRoute(targetId)
  }

  // No obvious target — fall back to the detail page.
  return `/notifications/${item.id}`
}

export function NotificationListScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const query = useNotificationsInfinite(10)
  const markAllRead = useMarkAllNotificationsRead()
  const markRead = useMarkNotificationRead()

  const items = useMemo<NotificationItem[]>(
    () => query.data?.pages.flatMap((page) => page.content ?? []) ?? [],
    [query.data],
  )

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)' as never)
  }, [router])

  const handlePressItem = useCallback(
    (item: NotificationItem) => {
      // Mark read (no-op visually until invalidation refetch lands).
      if (item.read === false) markRead.mutate(item.id)
      const target = resolveTarget(item)
      if (target == null) return
      if (typeof target === 'string' && /^https?:\/\//i.test(target)) {
        void Linking.openURL(target).catch(() => undefined)
        return
      }
      router.push(target as never)
    },
    [markRead, router],
  )

  const handleMarkAll = useCallback(() => {
    setMenuOpen(false)
    markAllRead.mutate()
  }, [markAllRead])

  const handleOpenSettings = useCallback(() => {
    setMenuOpen(false)
    router.push('/notifications/settings' as never)
  }, [router])

  const handleEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [query])

  const isInitialLoading = query.isLoading
  const isEmpty = !isInitialLoading && items.length === 0

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <NotificationHeader
        onBack={goBack}
        onMenuPress={() => setMenuOpen((v) => !v)}
      />

      <NotificationMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onMarkAllRead={handleMarkAll}
        onOpenSettings={handleOpenSettings}
      />

      {isInitialLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : query.isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>알림을 불러오지 못했어요.</Text>
        </View>
      ) : isEmpty ? (
        <NotificationEmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <NotificationListItem item={item} onPress={handlePressItem} />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={C.primary}
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={C.primary} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
  },
})
