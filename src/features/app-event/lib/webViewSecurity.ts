export type AppEventWebViewNavigationDecision =
  | { action: 'ALLOW_IN_WEBVIEW'; url: string }
  | { action: 'OPEN_EXTERNALLY'; url: string }
  | { action: 'BLOCK'; reason: 'INVALID_URL' | 'UNSUPPORTED_SCHEME' }

const PRODUCTION_LANDING_HOSTS = new Set(['storix.kr', 'www.storix.kr'])
const EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

// react-native-webview evaluates originWhitelist before
// onShouldStartLoadWithRequest. Passing every URL through ensures the
// classifier below remains the single navigation policy gate.
export const APP_EVENT_WEBVIEW_ORIGIN_WHITELIST: string[] = ['*']

export function buildAllowedLandingOrigins(baseUrl: string): string[] {
  try {
    const base = new URL(baseUrl)
    const origins = new Set([base.origin])

    if (
      base.protocol === 'https:' &&
      PRODUCTION_LANDING_HOSTS.has(base.hostname)
    ) {
      origins.add('https://storix.kr')
      origins.add('https://www.storix.kr')
    }

    return [...origins]
  } catch {
    return []
  }
}

export function isUrlFromAllowedOrigins(
  value: unknown,
  allowedOrigins: readonly string[],
): boolean {
  if (typeof value !== 'string') return false

  try {
    return allowedOrigins.includes(new URL(value).origin)
  } catch {
    return false
  }
}

export function isTrustedAppEventEntryUrl(
  value: unknown,
  allowedOrigins: readonly string[],
): boolean {
  if (!isUrlFromAllowedOrigins(value, allowedOrigins)) return false

  try {
    return /^\/event\/\d+\/?$/.test(new URL(value as string).pathname)
  } catch {
    return false
  }
}

export function classifyAppEventWebViewNavigation(
  value: unknown,
  allowedOrigins: readonly string[],
): AppEventWebViewNavigationDecision {
  if (value === 'about:blank') {
    return { action: 'ALLOW_IN_WEBVIEW', url: value }
  }

  if (typeof value !== 'string') {
    return { action: 'BLOCK', reason: 'INVALID_URL' }
  }

  try {
    const url = new URL(value)

    if (isUrlFromAllowedOrigins(url.toString(), allowedOrigins)) {
      return { action: 'ALLOW_IN_WEBVIEW', url: value }
    }

    if (EXTERNAL_PROTOCOLS.has(url.protocol)) {
      return { action: 'OPEN_EXTERNALLY', url: value }
    }

    return { action: 'BLOCK', reason: 'UNSUPPORTED_SCHEME' }
  } catch {
    return { action: 'BLOCK', reason: 'INVALID_URL' }
  }
}

export function shouldAllowAppEventWebViewNavigation(
  value: unknown,
  allowedOrigins: readonly string[],
  handlers: {
    openExternal: (url: string) => void | Promise<unknown>
    onBlocked?: (
      reason: Extract<AppEventWebViewNavigationDecision, { action: 'BLOCK' }>['reason'],
    ) => void
  },
): boolean {
  const decision = classifyAppEventWebViewNavigation(value, allowedOrigins)

  if (decision.action === 'ALLOW_IN_WEBVIEW') return true

  if (decision.action === 'OPEN_EXTERNALLY') {
    void handlers.openExternal(decision.url)
  } else {
    handlers.onBlocked?.(decision.reason)
  }

  return false
}

export function createAppEventAuthInjectionScript(
  accessToken: string | null,
  allowedOrigins: readonly string[],
): string {
  const serializedToken = JSON.stringify(accessToken)
  const serializedAllowedOrigins = JSON.stringify(allowedOrigins)

  return `
    (function () {
      var allowedOrigins = ${serializedAllowedOrigins};
      if (allowedOrigins.indexOf(window.location.origin) === -1) return;
      var detail = { accessToken: ${serializedToken} };
      window.__STORIX_AUTH__ = detail;
      window.dispatchEvent(new CustomEvent('STORIX_AUTH', { detail: detail }));
    })();
    true;
  `
}
