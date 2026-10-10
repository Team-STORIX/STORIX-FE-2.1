import {
  buildAllowedLandingOrigins,
  isTrustedAppEventEntryUrl,
  isUrlFromAllowedOrigins,
} from './webViewSecurity'

export type WebViewRoute = {
  pathname: '/webview'
  params: {
    url: string
  }
}

const DEFAULT_LANDING_BASE_URL = 'https://storix.kr'
const configuredLandingBaseUrl =
  process.env.EXPO_PUBLIC_LANDING_BASE_URL?.trim() || DEFAULT_LANDING_BASE_URL
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || ''

export const APP_EVENT_WEB_BASE_URL = configuredLandingBaseUrl?.replace(
  /\/+$/,
  '',
) ?? null
export const APP_EVENT_ALLOWED_ORIGINS = buildAllowedLandingOrigins(
  APP_EVENT_WEB_BASE_URL,
)

export function getValidHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const candidate = value.trim()
  if (!/^https?:\/\//i.test(candidate)) return null

  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? candidate
      : null
  } catch {
    return null
  }
}

export function getAppEventWebViewRoute(
  appEventId: unknown,
): WebViewRoute | null {
  if (
    APP_EVENT_WEB_BASE_URL == null ||
    typeof appEventId !== 'number' ||
    !Number.isSafeInteger(appEventId) ||
    appEventId <= 0
  ) {
    return null
  }

  const url = new URL(`${APP_EVENT_WEB_BASE_URL}/event/${appEventId}`)
  if (configuredApiBaseUrl.includes('dev.storix.kr')) {
    url.searchParams.set('api', 'dev')
  }

  return {
    pathname: '/webview',
    params: {
      url: url.toString(),
    },
  }
}

export function isTrustedAppEventUrl(value: unknown): boolean {
  if (!APP_EVENT_WEB_BASE_URL) return false

  const url = getValidHttpUrl(value)
  if (!url) return false

  return isTrustedAppEventEntryUrl(url, APP_EVENT_ALLOWED_ORIGINS)
}

export function isAppEventWebOrigin(value: unknown): boolean {
  if (!APP_EVENT_WEB_BASE_URL) return false

  const url = getValidHttpUrl(value)
  if (!url) return false

  return isUrlFromAllowedOrigins(url, APP_EVENT_ALLOWED_ORIGINS)
}
