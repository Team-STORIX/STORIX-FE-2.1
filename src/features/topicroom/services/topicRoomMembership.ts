// Kept free of API imports so it can be unit tested with node --test.

/** 403 returned by room-scoped endpoints when the user is not a participant. */
export const TOPIC_ROOM_NOT_MEMBER_CODE = 'TOPIC_ROOM_ERROR_008'

/**
 * Raised by read, notification and chat history calls since backend PR #284,
 * which replaced the old 404. The adult verification 403 on the same
 * endpoints carries a different code and is handled by the axios interceptor.
 */
export const isTopicRoomNotMemberError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false

  const response = (
    error as { response?: { status?: unknown; data?: { code?: unknown } } }
  ).response

  return (
    response?.status === 403 &&
    response.data?.code === TOPIC_ROOM_NOT_MEMBER_CODE
  )
}
