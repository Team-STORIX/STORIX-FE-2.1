import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import {
  getNotificationSettings,
  updateMarketingConsent,
  updateNotificationSettings,
} from '../api/notification.api'
import { notificationKeys } from '../api/notification.keys'
import type {
  NotificationSettings,
  UpdateNotificationSettingsPayload,
} from '../api/notification.schema'

/** GET /api/v1/notifications/settings */
export function useNotificationSettings(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.settings,
    enabled,
    queryFn: getNotificationSettings,
  })
}

/**
 * PATCH /api/v1/notifications/settings.
 *
 * The body carries only the changed field(s). Optimistically patches the
 * cached settings so the toggle flips immediately, rolls back on error, and
 * refetches on settle to converge on server truth.
 */
export function useUpdateNotificationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateNotificationSettingsPayload) =>
      updateNotificationSettings(payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: notificationKeys.settings })
      const previous = qc.getQueryData<NotificationSettings>(
        notificationKeys.settings,
      )
      if (previous) {
        qc.setQueryData<NotificationSettings>(notificationKeys.settings, {
          ...previous,
          ...payload,
        })
      }
      return { previous }
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(notificationKeys.settings, ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.settings })
    },
  })
}

/**
 * Toggle the event/benefit (marketing) consent from the notification settings
 * screen. The settings PATCH does not accept eventBenefitEnabled, so this drives
 * the marketing-consent endpoint instead and reconciles the settings cache.
 *
 * Unlike the first-home consent modal (useUpdateMarketingConsent +
 * useNotificationConsentModal), this path deliberately does NOT open the result
 * modal or touch the one-time consent-completed storage — it only flips the
 * receiving preference. It mirrors the choice into the auth marketing flag for
 * app-wide consistency, matching the modal's behaviour.
 */
export function useUpdateEventBenefitConsent() {
  const qc = useQueryClient()
  const setMarketingAgree = useAuthStore((s) => s.setMarketingAgree)
  return useMutation({
    mutationFn: (eventBenefitEnabled: boolean) =>
      updateMarketingConsent(eventBenefitEnabled),
    onMutate: async (eventBenefitEnabled) => {
      await qc.cancelQueries({ queryKey: notificationKeys.settings })
      const previous = qc.getQueryData<NotificationSettings>(
        notificationKeys.settings,
      )
      if (previous) {
        qc.setQueryData<NotificationSettings>(notificationKeys.settings, {
          ...previous,
          eventBenefitEnabled,
        })
      }
      return { previous }
    },
    onError: (_err, _enabled, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(notificationKeys.settings, ctx.previous)
      }
    },
    onSuccess: (_res, enabled) => {
      // Keep the app-wide marketing flag in sync (best-effort).
      void setMarketingAgree(enabled)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.settings })
    },
  })
}
