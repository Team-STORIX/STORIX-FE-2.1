import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ackAppEventTitleEvent,
  appEventKeys,
  dismissAppEventPopup,
  getAppEventBanners,
  getAppEventDetail,
  getAppEventPopup,
  getAppEventTitleEvents,
  neverShowAppEventPopup,
} from '../api'

/** GET /api/v1/app-events/{appEventId} */
export function useAppEventDetail(
  appEventId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: appEventKeys.detail(appEventId ?? 0),
    enabled: enabled && appEventId != null,
    queryFn: () => getAppEventDetail(appEventId as number),
  })
}

/** GET /api/v1/app-events/title */
export function useAppEventTitleEvents(enabled = true) {
  return useQuery({
    queryKey: appEventKeys.titleEvents,
    enabled,
    queryFn: getAppEventTitleEvents,
  })
}

/** PATCH /api/v1/app-events/title/{eventId}/ack */
export function useAckAppEventTitleEvent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ackAppEventTitleEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appEventKeys.titleEvents })
    },
  })
}

/** GET /api/v1/app-events/popup */
export function useAppEventPopup(enabled = true) {
  return useQuery({
    queryKey: appEventKeys.popup,
    enabled,
    queryFn: getAppEventPopup,
  })
}

/** PATCH /api/v1/app-events/popup/{popupId}/dismiss */
export function useDismissAppEventPopup() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: dismissAppEventPopup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appEventKeys.popup })
    },
  })
}

/** PATCH /api/v1/app-events/popup/{popupId}/never-show */
export function useNeverShowAppEventPopup() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: neverShowAppEventPopup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appEventKeys.popup })
    },
  })
}

/** GET /api/v1/app-events/banner */
export function useAppEventBanners(enabled = true) {
  return useQuery({
    queryKey: appEventKeys.banners,
    enabled,
    queryFn: getAppEventBanners,
  })
}
