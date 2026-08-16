import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSegments } from 'expo-router'
import {
  type AppEventTitleEvent,
  useAckAppEventTitleEvent,
  useAppEventTitleEvents,
} from '../../app-event'
import { useAuthStore } from '../../../store/auth.store'
import { useProfileStore } from '../store/profile.store'
import { TitleAchievementModal } from './TitleAchievementModal'

type TitleAchievementPayload = {
  title: string
  nickname: string
  topGenre: string | null
}

type PendingTitleAchievement = {
  eventId: number
  payload: TitleAchievementPayload
  ackRequired: boolean
}

const TITLE_PAYLOAD_KEYS = ['title', 'titleName', 'newTitle', 'name']
const NICKNAME_PAYLOAD_KEYS = [
  'nickname',
  'nickName',
  'nick_name',
  'userName',
  'userNickname',
  'userNickName',
  'readerNickname',
  'readerNickName',
  'memberNickname',
  'memberNickName',
  'profileNickname',
  'profileNickName',
]
const TOP_GENRE_PAYLOAD_KEYS = ['topGenre', 'genre', 'genreKey']

const isTitleAchievementModalRoute = (segments: readonly string[]): boolean => {
  const [group, screen] = segments
  return group === '(tabs)' && (screen == null || screen === 'index' || screen === 'profile')
}

const getPayloadString = (
  payload: Record<string, unknown>,
  keys: readonly string[],
): string | null => {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }
  return null
}

const toPendingTitleAchievement = (
  event: AppEventTitleEvent,
  fallbackNickname: string,
): PendingTitleAchievement | null => {
  const title = getPayloadString(event.payload, TITLE_PAYLOAD_KEYS)
  if (!title) return null

  return {
    eventId: event.id,
    ackRequired: event.ackRequired,
    payload: {
      title,
      nickname:
        getPayloadString(event.payload, NICKNAME_PAYLOAD_KEYS) ??
        fallbackNickname,
      topGenre: getPayloadString(event.payload, TOP_GENRE_PAYLOAD_KEYS),
    },
  }
}

type TitleAchievementDetectorProps = {
  blocked?: boolean
  onVisibilityChange?: (visible: boolean) => void
}

export function TitleAchievementDetector({
  blocked = false,
  onVisibilityChange,
}: TitleAchievementDetectorProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const fallbackNickname = useProfileStore((s) => s.me?.nickName?.trim() ?? '')
  const segments = useSegments()
  const titleEventsQuery = useAppEventTitleEvents(isAuthenticated)
  const ackTitleEventMutation = useAckAppEventTitleEvent()
  const [achievementModal, setAchievementModal] =
    useState<PendingTitleAchievement | null>(null)
  const canShowAchievementModal =
    !blocked && isTitleAchievementModalRoute(segments as readonly string[])

  const nextAchievement = useMemo(
    () =>
      (titleEventsQuery.data ?? [])
        .map((event) => toPendingTitleAchievement(event, fallbackNickname))
        .find((event): event is PendingTitleAchievement => event != null) ?? null,
    [fallbackNickname, titleEventsQuery.data],
  )

  useEffect(() => {
    onVisibilityChange?.(achievementModal != null)
  }, [achievementModal, onVisibilityChange])

  useEffect(() => {
    if (!canShowAchievementModal || achievementModal || !nextAchievement) return
    setAchievementModal(nextAchievement)
  }, [achievementModal, canShowAchievementModal, nextAchievement])

  const handleClose = useCallback(async () => {
    const closingEvent = achievementModal
    setAchievementModal(null)

    if (!closingEvent?.ackRequired) return

    try {
      await ackTitleEventMutation.mutateAsync(closingEvent.eventId)
    } catch (error) {
      console.error('Failed to ack title achievement event:', error)
    }
  }, [achievementModal, ackTitleEventMutation])

  return (
    <TitleAchievementModal
      visible={achievementModal != null}
      onClose={handleClose}
      title={achievementModal?.payload.title ?? ''}
      nickname={achievementModal?.payload.nickname ?? ''}
      topGenre={achievementModal?.payload.topGenre ?? null}
    />
  )
}
