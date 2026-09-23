// Splits user-authored text into plain and link segments so feed posts,
// comments, reviews and chat messages can render tappable URLs.

/**
 * Hangul is excluded from the URL body so a Korean particle written directly
 * after a link ("https://storix.kr에서") is not swallowed into the href. The
 * trade-off is that raw, non percent-encoded Korean inside a path is not
 * matched; browsers and share sheets emit percent-encoded paths anyway.
 */
const URL_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>"'`가-힣ㄱ-ㆎᄀ-ᇿ]+/gi

const TRAILING_PUNCTUATION = /[.,!?;:'"’”…)\]}>]+$/

const CLOSING_PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' }

/**
 * Scheme is pinned literally rather than parsed with `URL`, whose React Native
 * implementation is not spec-complete (it does not reliably throw on malformed
 * input). A host with at least one dot is required so "3.5점" style text and
 * bare hosts such as "localhost" never become links.
 */
const VALID_URL = /^https?:\/\/[^\s/?#]+\.[^\s/?#.]{2,}(?:[/?#]\S*)?$/i

export type LinkSegment = {
  text: string
  /** Absolute http/https URL to open, or undefined for plain text. */
  url?: string
}

function countOccurrences(value: string, char: string): number {
  let total = 0
  for (const current of value) if (current === char) total += 1
  return total
}

/**
 * Sentence punctuation that trails a URL belongs to the sentence, not the link.
 * A closing bracket is kept when the link itself opened it, so paths such as
 * "/wiki/Example_(film)" survive.
 */
export function trimTrailingPunctuation(raw: string): string {
  const trimmed = raw.replace(TRAILING_PUNCTUATION, '')
  if (trimmed === raw) return raw

  let restored = trimmed
  for (const char of raw.slice(trimmed.length)) {
    const opener = CLOSING_PAIRS[char]
    if (opener == null) break

    const candidate = `${restored}${char}`
    if (countOccurrences(candidate, opener) < countOccurrences(candidate, char)) break
    restored = candidate
  }

  return restored
}

/** Returns an absolute http/https URL, or null when the text is not linkable. */
export function normalizeLinkUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const raw = trimTrailingPunctuation(value.trim())
  if (raw.length === 0) return null

  const candidate = /^www\./i.test(raw) ? `https://${raw}` : raw
  return VALID_URL.test(candidate) ? candidate : null
}

export function splitLinkSegments(value: string): LinkSegment[] {
  if (typeof value !== 'string' || value.length === 0) return []

  const segments: LinkSegment[] = []
  let cursor = 0

  for (const match of value.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0
    if (start < cursor) continue

    const linkText = trimTrailingPunctuation(match[0])
    const url = normalizeLinkUrl(linkText)
    // Unlinkable matches stay inside the surrounding plain-text segment.
    if (url == null) continue

    if (start > cursor) segments.push({ text: value.slice(cursor, start) })
    segments.push({ text: linkText, url })
    cursor = start + linkText.length
  }

  if (segments.length === 0) return value.length > 0 ? [{ text: value }] : []
  if (cursor < value.length) segments.push({ text: value.slice(cursor) })

  return segments
}

export function hasLink(value: string): boolean {
  return splitLinkSegments(value).some((segment) => segment.url != null)
}
