// Push-notification payload parsing + click routing.
//
// Backend payload contract (PUSH-FOREGROUND-HANDLER-1):
//  - Android sends a `notification` block (OS shows the banner in background)
//    PLUS a `data` block.
//  - iOS sends `aps.alert` (OS shows the banner in background) PLUS custom
//    `data`.
//  - Foreground handling must read title/body from `message.data.title` /
//    `message.data.body` first, falling back to `message.notification`.
//
// FCM delivers every `data` value as a string, so all IDs arrive as strings and
// must be coerced defensively (see `toId`).

// ---------- types ----------

/** targetType drives where a tapped notification lands. */
export type PushTargetType =
  | 'FEED'
  | 'REVIEW'
  | 'COMMENT'
  | 'TOPIC_ROOM'
  | 'NONE'
  | (string & {})

/** Known notification kinds; tolerant of unknown future values. */
export type PushNotificationType =
  | 'LIKE_FEED'
  | 'LIKE_REVIEW'
  | 'LIKE_COMMENT'
  | 'COMMENT_ON_FEED'
  | 'REPLY_ON_COMMENT'
  | 'TODAY_FEED'
  | 'HOT_TOPIC_ROOM'
  | 'MARKETING'
  | 'REPORT_RECEIVED'
  | 'REPORT_PROCESSED'
  | 'RESTRICTION_7D'
  | 'RESTRICTION_30D'
  | 'TOS_UPDATE'
  | 'PRIVACY_UPDATE'
  | 'FEATURE_UPDATE'
  | (string & {})

export type PushCategory =
  | 'FEED'
  | 'REVIEW'
  | 'TOPIC_ROOM'
  | 'MARKETING'
  | 'REPORT'
  | 'POLICY'
  | (string & {})

export interface ParsedPushPayload {
  notificationId: number | null
  type: PushNotificationType | null
  category: PushCategory | null
  targetType: PushTargetType
  targetId: number | null
  parentTargetId: number | null
  title: string | null
  body: string | null
  /** The original (raw) data bag, retained for debugging only. */
  raw: Record<string, string>
}

/**
 * A route the click handler can hand to `router.push`. Either a bare path
 * string or an expo-router `{ pathname, params }` object (used to preserve
 * comment-focus params).
 */
export type PushRoute =
  | string
  | { pathname: string; params: Record<string, string | number> }

// ---------- helpers ----------

/**
 * Coerce an FCM data value (always a string, sometimes absent) into a positive
 * integer id, or null when it is missing / blank / non-numeric / <= 0.
 */
function toId(value: unknown): number | null {
  if (value == null) return null
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const s = String(value).trim()
  if (s.length === 0) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function toStr(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const s = value.trim()
  return s.length === 0 ? null : s
}

// ---------- parser ----------

/**
 * Parse the `data` bag from an FCM `RemoteMessage`. Returns null only when the
 * input is not an object at all; otherwise it always returns a payload with
 * `targetType` defaulting to 'NONE' so callers can route safely.
 */
export function parsePushNotificationData(
  data: unknown,
): ParsedPushPayload | null {
  if (data == null || typeof data !== 'object') return null

  const d = data as Record<string, unknown>
  const raw: Record<string, string> = {}
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === 'string') raw[k] = v
    else if (v != null) raw[k] = String(v)
  }

  return {
    notificationId: toId(d.notificationId),
    type: (toStr(d.type) as PushNotificationType | null) ?? null,
    category: (toStr(d.category) as PushCategory | null) ?? null,
    targetType: ((toStr(d.targetType) ?? 'NONE').toUpperCase() as PushTargetType),
    targetId: toId(d.targetId),
    parentTargetId: toId(d.parentTargetId),
    title: toStr(d.title),
    body: toStr(d.body),
    raw,
  }
}

/**
 * Resolve the display title/body. Foreground display reads `data.title` /
 * `data.body` first (per the backend contract), and callers should pass the
 * `notification.title` / `notification.body` fallbacks when available.
 */
export function getPushTitleBody(
  payload: ParsedPushPayload | null,
  fallback?: { title?: string | null; body?: string | null },
): { title: string; body: string } {
  return {
    title: payload?.title ?? fallback?.title ?? '',
    body: payload?.body ?? fallback?.body ?? '',
  }
}

/**
 * Map a parsed payload onto an in-app route.
 *
 * Route table (verified against app/ on 2026-05-26):
 *   FEED        -> /feed/{targetId}              (app/feed/[boardId].tsx)
 *   REVIEW      -> /works/review/{targetId}      (app/works/review/[reviewId].tsx)
 *   TOPIC_ROOM  -> /topicroom/{targetId}         (app/topicroom/[roomId].tsx)
 *   COMMENT     -> /feed/{parentTargetId}        (parent feed; see TODO below)
 *   NONE/other  -> /notifications/{id} or /notifications
 *
 * Anything that cannot be resolved falls back to the notification list/detail —
 * we never invent a route that does not exist under app/.
 */
export function getNotificationRoute(
  payload: ParsedPushPayload | null,
): PushRoute {
  const notificationFallback = (): PushRoute =>
    payload?.notificationId != null
      ? `/notifications/${payload.notificationId}`
      : '/notifications'

  if (!payload) return '/notifications'

  switch (payload.targetType) {
    case 'FEED':
      return payload.targetId != null
        ? `/feed/${payload.targetId}`
        : notificationFallback()

    case 'REVIEW':
      return payload.targetId != null
        ? `/works/review/${payload.targetId}`
        : notificationFallback()

    case 'TOPIC_ROOM':
      return payload.targetId != null
        ? `/topicroom/${payload.targetId}`
        : notificationFallback()

    case 'COMMENT': {
      // Comments live under their parent feed. parentTargetId = feedId.
      const feedId = payload.parentTargetId
      if (feedId == null) return notificationFallback()
      // TODO(PUSH-COMMENT-FOCUS): app/feed/[boardId].tsx (FeedDetailScreen)
      // currently only reads the `boardId` param and does not consume a
      // comment-focus param. We forward `commentId` so the route is ready for
      // when comment scrolling/highlighting is wired up; until then it is a
      // harmless, ignored param.
      const commentId = payload.targetId
      return commentId != null
        ? { pathname: `/feed/${feedId}`, params: { commentId } }
        : `/feed/${feedId}`
    }

    case 'NONE':
    default:
      return notificationFallback()
  }
}
