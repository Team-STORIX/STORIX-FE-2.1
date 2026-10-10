import { apiClient } from '../../../lib/api/axios-instance'
import {
  AppEventBannersResponseSchema,
  AppEventDetailResponseSchema,
  AppEventPopupResponseSchema,
  AppEventTitleEventsResponseSchema,
  EmptyResultResponseSchema,
  type AppEventBanner,
  type AppEventDetail,
  type AppEventPopup,
  type AppEventTitleEvent,
} from './appEvent.schema'

const BASE = '/api/v1/app-events'

/** GET /api/v1/app-events/{appEventId} */
export async function getAppEventDetail(
  appEventId: number,
): Promise<AppEventDetail> {
  const res = await apiClient.get(`${BASE}/${appEventId}`)
  return AppEventDetailResponseSchema.parse(res.data).result
}

/** GET /api/v1/app-events/title */
export async function getAppEventTitleEvents(): Promise<AppEventTitleEvent[]> {
  const res = await apiClient.get(`${BASE}/title`)
  return AppEventTitleEventsResponseSchema.parse(res.data).result
}

/** PATCH /api/v1/app-events/title/{eventId}/ack */
export async function ackAppEventTitleEvent(eventId: number): Promise<void> {
  const res = await apiClient.patch(`${BASE}/title/${eventId}/ack`)
  EmptyResultResponseSchema.parse(res.data)
}

/** GET /api/v1/app-events/popup */
export async function getAppEventPopup(): Promise<AppEventPopup | null> {
  const res = await apiClient.get(`${BASE}/popup`)
  return AppEventPopupResponseSchema.parse(res.data).result
}

/** PATCH /api/v1/app-events/popup/{popupId}/dismiss */
export async function dismissAppEventPopup(popupId: number): Promise<void> {
  const res = await apiClient.patch(`${BASE}/popup/${popupId}/dismiss`)
  EmptyResultResponseSchema.parse(res.data)
}

/** PATCH /api/v1/app-events/popup/{popupId}/never-show */
export async function neverShowAppEventPopup(popupId: number): Promise<void> {
  const res = await apiClient.patch(`${BASE}/popup/${popupId}/never-show`)
  EmptyResultResponseSchema.parse(res.data)
}

/** GET /api/v1/app-events/banner */
export async function getAppEventBanners(): Promise<AppEventBanner[]> {
  const res = await apiClient.get(`${BASE}/banner`)
  return AppEventBannersResponseSchema.parse(res.data).result
}
