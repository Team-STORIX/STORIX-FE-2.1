import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../api/notification.api'
import { notificationKeys } from '../api/notification.keys'
import type { UpdateNotificationSettingsPayload } from '../api/notification.schema'

/** GET /api/v1/notifications/settings */
export function useNotificationSettings(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.settings,
    enabled,
    queryFn: getNotificationSettings,
  })
}

/** PATCH /api/v1/notifications/settings */
export function useUpdateNotificationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateNotificationSettingsPayload) =>
      updateNotificationSettings(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.settings })
    },
  })
}
