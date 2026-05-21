import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  getNotifications,
  getUnreadNotificationCount,
} from '../api/notification.api'
import { notificationKeys } from '../api/notification.keys'
import type { NotificationPage } from '../api/notification.schema'

/**
 * Cursor-paginated notification list. The cursor is the id of the last item on
 * the previous page; the first page omits it.
 */
export function useNotificationsInfinite(size = 10) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(size),
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) =>
      getNotifications({ cursorId: pageParam, size }),
    getNextPageParam: (lastPage: NotificationPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      const items = lastPage.content
      if (!items || items.length === 0) return undefined
      return items[items.length - 1].id
    },
  })
}

/** Unread badge count. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    enabled,
    queryFn: getUnreadNotificationCount,
  })
}
