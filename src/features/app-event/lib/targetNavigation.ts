export type WebViewRoute = {
  pathname: '/webview'
  params: {
    url: string
  }
}

const DEFAULT_LANDING_BASE_URL = 'https://storix.kr'
const configuredLandingBaseUrl =
  process.env.EXPO_PUBLIC_LANDING_BASE_URL?.trim() || DEFAULT_LANDING_BASE_URL

export const APP_EVENT_WEB_BASE_URL = configuredLandingBaseUrl?.replace(
  /\/+$/,
  '',
) ?? null

function isAllowedLandingOrigin(candidate: URL, configuredBase: URL): boolean {
  if (candidate.origin === configuredBase.origin) return true

  const storixLandingHosts = new Set(['storix.kr', 'www.storix.kr'])
  return (
    candidate.protocol === 'https:' &&
    configuredBase.protocol === 'https:' &&
    storixLandingHosts.has(candidate.hostname) &&
    storixLandingHosts.has(configuredBase.hostname)
  )
}

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

  const url = `${APP_EVENT_WEB_BASE_URL}/event/${appEventId}`

  return {
    pathname: '/webview',
    params: {
      url,
    },
  }
}

export function isTrustedAppEventUrl(value: unknown): boolean {
  if (!APP_EVENT_WEB_BASE_URL) return false

  const url = getValidHttpUrl(value)
  if (!url) return false

  try {
    const candidate = new URL(url)
    const base = new URL(APP_EVENT_WEB_BASE_URL)
    return isAllowedLandingOrigin(candidate, base) &&
      /^\/event\/\d+\/?$/.test(candidate.pathname)
  } catch {
    return false
  }
}

export function isAppEventWebOrigin(value: unknown): boolean {
  if (!APP_EVENT_WEB_BASE_URL) return false

  const url = getValidHttpUrl(value)
  if (!url) return false

  try {
    return isAllowedLandingOrigin(
      new URL(url),
      new URL(APP_EVENT_WEB_BASE_URL),
    )
  } catch {
    return false
  }
}
