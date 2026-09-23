// Splits user-authored text into plain and link segments so feed posts,
// comments, reviews and chat messages can render tappable URLs.

/**
 * Hangul is excluded from the URL body so a Korean particle written directly
 * after a link ("https://storix.kr에서") is not swallowed into the href. The
 * same cut also lands inside a Korean path or query, where linking the prefix
 * would silently point at a different page, so isTruncatedByHangul spots those
 * and drops the link entirely instead.
 */
const URL_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>"'`가-힣ㄱ-ㆎᄀ-ᇿ]+/gi

const HANGUL = /[가-힣ㄱ-ㆎᄀ-ᇿ]/

/** An address that stops on one of these is mid-path or mid-value, not done. */
const DELIMITER_TAIL = /[/?#=&]$/

/**
 * Characters that continue an address. Sentence punctuation is left out, since
 * "?" or "." after Korean ends a sentence ("https://storix.kr에서요?").
 */
const URL_CONTINUATION = /[A-Za-z0-9%/=&_~+:-]/

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

/**
 * Tells a trailing Korean particle apart from Hangul that sat inside the
 * address. The boundary is genuinely ambiguous, so the address is protected by
 * refusing to link at all whenever the match looks cut short:
 *
 *   https://storix.kr/works/1에서   → particle, link the address
 *   https://namu.wiki/w/전지적독자   → cut after "/", link nothing
 *   https://example.com/?q=웹툰&p=2 → cut after "=", link nothing
 */
function isTruncatedByHangul(linkText: string, rest: string): boolean {
  if (rest.length === 0 || !HANGUL.test(rest[0])) return false
  if (DELIMITER_TAIL.test(linkText)) return true

  let index = 0
  while (index < rest.length && HANGUL.test(rest[index])) index += 1

  // More address after the Hangul run means the run was part of the address.
  return index < rest.length && URL_CONTINUATION.test(rest[index])
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
    if (isTruncatedByHangul(linkText, value.slice(start + linkText.length))) continue

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
