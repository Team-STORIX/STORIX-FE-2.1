export type WebViewRoute = {
  pathname: '/webview'
  params: {
    url: string
    title?: string
  }
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
  targetLink: unknown,
  title?: string | null,
): WebViewRoute | null {
  const url = getValidHttpUrl(targetLink)
  if (!url) return null

  const normalizedTitle = title?.trim()
  return {
    pathname: '/webview',
    params: {
      url,
      ...(normalizedTitle ? { title: normalizedTitle } : {}),
    },
  }
}
