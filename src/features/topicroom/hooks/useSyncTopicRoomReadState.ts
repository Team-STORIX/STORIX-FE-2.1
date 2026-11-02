import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { notificationKeys } from '../../notification/api/notification.keys'
import {
  clearTopicRoomDisplayedNotifications,
  refreshAppBadgeCount,
} from '../../notification/services/notifeeNative'
import { markTopicRoomRead } from '../api/topicroom.api'

/**
 * Reconciles every read-state surface when a room becomes visible:
 * backend unread counts, the room's OS tray notification, React Query badges,
 * and the native app badge. Failures are best-effort and never block entry.
 */
export function useSyncTopicRoomReadState(roomId: number) {
  const queryClient = useQueryClient()
  const inFlightRef = useRef<Promise<void> | null>(null)

  return useCallback((): Promise<void> => {
    if (!Number.isFinite(roomId) || roomId <= 0) return Promise.resolve()
    if (inFlightRef.current) return inFlightRef.current

    const operation = (async () => {
      try {
        await markTopicRoomRead(roomId)
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[topicroom] read sync failed', { roomId, err })
        }
      }

      try {
        await clearTopicRoomDisplayedNotifications(roomId)
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[topicroom] tray notification clear failed', {
            roomId,
            err,
          })
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['topicroom', 'unread'] }),
        queryClient.invalidateQueries({ queryKey: ['topicroom', 'me'] }),
      ])

      try {
        const count = await refreshAppBadgeCount()
        queryClient.setQueryData(notificationKeys.badgeCount, count)
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[topicroom] app badge refresh failed', { roomId, err })
        }
      }
    })().finally(() => {
      inFlightRef.current = null
    })

    inFlightRef.current = operation
    return operation
  }, [queryClient, roomId])
}
