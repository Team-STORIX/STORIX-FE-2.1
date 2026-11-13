// Kept free of API imports so it can be unit tested with node --test.

/**
 * How the server classifies a STOMP ERROR frame (its `message` header), per the
 * backend's WebSocket error doc (PR #287):
 * - unauthorized: token problem, refresh and reconnect.
 * - forbidden: needs a user action (adult verification, joining the room);
 *   reconnecting gets the same answer.
 * - badRequest: the room or works is gone, or the frame was invalid; do not reconnect.
 * - other: server-side or unknown, reconnecting may help.
 */
export type StompRejectionKind = 'unauthorized' | 'forbidden' | 'badRequest' | 'other'

export type StompRejection = {
  kind: StompRejectionKind
  code: string | null
}

const parseCode = (body: string | undefined): string | null => {
  if (!body) return null
  try {
    const parsed = JSON.parse(body) as { code?: unknown }
    return typeof parsed?.code === 'string' ? parsed.code : null
  } catch {
    return null
  }
}

export const classifyStompRejection = (
  messageHeader: unknown,
  body: string | undefined,
): StompRejection => {
  const header = String(messageHeader ?? '').toUpperCase()
  const code = parseCode(body)

  // Older servers put UNAUTHORIZED only in the body, so check both.
  if (header.includes('UNAUTHORIZED') || /UNAUTHORIZED/i.test(body ?? '')) {
    return { kind: 'unauthorized', code }
  }
  if (header.includes('FORBIDDEN')) return { kind: 'forbidden', code }
  if (header.includes('BAD_REQUEST')) return { kind: 'badRequest', code }
  return { kind: 'other', code }
}

/** 403 statuses for the forbidden codes, so REST error predicates can be reused. */
export const toRestLikeError = (rejection: StompRejection) => ({
  response: {
    status: rejection.kind === 'forbidden' ? 403 : 400,
    data: { code: rejection.code },
  },
})
