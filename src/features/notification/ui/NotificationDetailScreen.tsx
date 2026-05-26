import { useCallback, useEffect, useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { C, Gray } from '../../../theme'
import { formatTimeAgo } from '../../../lib/utils/formatTimeAgo'
import { useMarkNotificationRead, useNotificationsInfinite } from '../hooks'
import type { NotificationItem } from '../api/notification.schema'
import { NotificationHeader } from './NotificationHeader'
import { NotificationIcon } from './NotificationIcon'

/**
 * Notification detail (Figma 7156:12533). The list API has no dedicated detail
 * endpoint, so we read the item from the shared infinite-list query cache and
 * fall back to a minimal view if it isn't loaded (e.g. cold deep-link).
 */
export function NotificationDetailScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id: idParam } = useLocalSearchParams<{ id: string }>()
  const id = typeof idParam === 'string' ? Number(idParam) : NaN

  const query = useNotificationsInfinite(10)
  const markRead = useMarkNotificationRead()

  const item = useMemo<NotificationItem | undefined>(
    () =>
      query.data?.pages
        .flatMap((page) => page.content ?? [])
        .find((n) => n.id === id),
    [query.data, id],
  )

  // Mark as read once we can see it's unread.
  useEffect(() => {
    if (item?.read === false) markRead.mutate(item.id)
    // Only react to identity/read changes — markRead is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, item?.read])

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/notifications' as never)
  }, [router])

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <NotificationHeader onBack={goBack} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {item ? (
          <>
            <View style={styles.categoryRow}>
              <NotificationIcon
                notificationType={item.notificationType}
                category={item.category}
                size={20}
              />
              <Text style={styles.category}>
                {item.category ?? item.notificationType}
              </Text>
            </View>

            {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
            <Text style={styles.date}>{formatTimeAgo(item.createdAt)}</Text>

            {item.content ? (
              <Text style={styles.body}>{item.content}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.fallback}>알림 정보를 찾을 수 없어요.</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: Gray[500],
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: Gray[900],
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: Gray[400],
  },
  body: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Gray[700],
  },
  fallback: {
    marginTop: 40,
    fontSize: 14,
    fontWeight: '500',
    color: C.textMuted,
    textAlign: 'center',
  },
})
