const assert = require('node:assert/strict')
const test = require('node:test')

const loadModule = () => import('../stompRejection.ts')

const body = (code) => JSON.stringify({ isSuccess: false, code, message: '...' })

test('frames are classified by their message header', async () => {
  const { classifyStompRejection } = await loadModule()

  assert.deepEqual(classifyStompRejection('UNAUTHORIZED', body('TOKEN_ERROR_003')), {
    kind: 'unauthorized',
    code: 'TOKEN_ERROR_003',
  })
  assert.deepEqual(classifyStompRejection('FORBIDDEN', body('ADULT_VERIFICATION_ERROR_008')), {
    kind: 'forbidden',
    code: 'ADULT_VERIFICATION_ERROR_008',
  })
  assert.deepEqual(classifyStompRejection('BAD_REQUEST', body('TOPIC_ROOM_ERROR_003')), {
    kind: 'badRequest',
    code: 'TOPIC_ROOM_ERROR_003',
  })
  assert.deepEqual(classifyStompRejection('INTERNAL_ERROR', body('CHAT_ERROR_002')), {
    kind: 'other',
    code: 'CHAT_ERROR_002',
  })
})

test('UNAUTHORIZED only in the body still counts, and a bad body has no code', async () => {
  const { classifyStompRejection } = await loadModule()

  assert.equal(classifyStompRejection(undefined, 'UNAUTHORIZED').kind, 'unauthorized')
  assert.deepEqual(classifyStompRejection('FORBIDDEN', 'not json'), {
    kind: 'forbidden',
    code: null,
  })
})

test('forbidden rejections read like the REST 403 for the same code', async () => {
  const { classifyStompRejection, toRestLikeError } = await loadModule()
  const { isTopicRoomNotMemberError } = await import('../topicRoomMembership.ts')

  const { isAdultVerificationRequiredError } = await import(
    '../../../../lib/api/adultVerificationRequired.ts'
  )

  const notMember = toRestLikeError(classifyStompRejection('FORBIDDEN', body('TOPIC_ROOM_ERROR_008')))
  assert.equal(isTopicRoomNotMemberError(notMember), true)

  const adult = toRestLikeError(classifyStompRejection('FORBIDDEN', body('ADULT_VERIFICATION_ERROR_008')))
  assert.equal(isAdultVerificationRequiredError(adult), true)
})
