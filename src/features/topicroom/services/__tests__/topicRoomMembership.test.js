const assert = require('node:assert/strict')
const test = require('node:test')

const loadModule = () => import('../topicRoomMembership.ts')

const axiosLikeError = (status, code) => ({
  response: { status, data: { code } },
})

test('403 with the not-member code is detected', async () => {
  const { isTopicRoomNotMemberError } = await loadModule()

  assert.equal(
    isTopicRoomNotMemberError(axiosLikeError(403, 'TOPIC_ROOM_ERROR_008')),
    true,
  )
})

test('adult verification 403 on the same endpoints is not a membership error', async () => {
  const { isTopicRoomNotMemberError } = await loadModule()

  assert.equal(
    isTopicRoomNotMemberError(
      axiosLikeError(403, 'ADULT_VERIFICATION_ERROR_008'),
    ),
    false,
  )
})

test('the old 404 and malformed errors are ignored', async () => {
  const { isTopicRoomNotMemberError } = await loadModule()

  assert.equal(
    isTopicRoomNotMemberError(axiosLikeError(404, 'TOPIC_ROOM_ERROR_008')),
    false,
  )
  assert.equal(isTopicRoomNotMemberError(new Error('network')), false)
  assert.equal(isTopicRoomNotMemberError(null), false)
})
