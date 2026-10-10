// Splits user-authored text into plain and link segments so feed posts,
// comments, reviews and chat messages can render tappable URLs.

/**
 * An address runs to the next whitespace, the same rule every messenger uses.
 * Korean writes particles with no space ("https://storix.kr에서"), so the
 * boundary is genuinely ambiguous — the path could be Korean, or the Hangul
 * could be a particle, and nothing in the text tells the two apart. Cutting at
 * the first Hangul character was worse than guessing: it silently linked a
 * prefix that resolved to a different page. Keeping the whole run means a link
 * either opens what was shared or fails to load, never something else.
 */
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi

const HANGUL = /[가-힣ㄱ-ㆎᄀ-ᇿ]/

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
 * Hangul inside a host is always a particle: a domain cannot continue past its
 * TLD without a dot, and an IDN host would have started in Hangul. Cutting here
 * keeps "https://storix.kr에서" resolvable, while Hangul after the first "/"
 * is left alone because it may well be the path that was shared.
 */
export function cutHostParticle(raw: string): string {
  const schemeEnd = raw.indexOf('://')
  const hostStart = schemeEnd >= 0 ? schemeEnd + 3 : 0

  const pathOffset = raw.slice(hostStart).search(/[/?#]/)
  const hostEnd = pathOffset >= 0 ? hostStart + pathOffset : raw.length

  const hangulOffset = raw.slice(hostStart, hostEnd).search(HANGUL)
  return hangulOffset >= 0 ? raw.slice(0, hostStart + hangulOffset) : raw
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

/** Trims a match down to the text that is actually part of the address. */
function toLinkText(raw: string): string {
  return trimTrailingPunctuation(cutHostParticle(raw))
}

/** Returns an absolute http/https URL, or null when the text is not linkable. */
export function normalizeLinkUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const raw = toLinkText(value.trim())
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

    const linkText = toLinkText(match[0])
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
