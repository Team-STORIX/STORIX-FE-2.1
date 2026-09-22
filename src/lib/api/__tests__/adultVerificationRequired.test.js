const assert = require('node:assert/strict')
const test = require('node:test')

const loadModule = () => import('../adultVerificationRequired.ts')

const axiosLikeError = (status, code) => ({
  response: { status, data: { code } },
})

test('403 with the adult verification code is detected', async () => {
  const { isAdultVerificationRequiredError } = await loadModule()

  assert.equal(
    isAdultVerificationRequiredError(
      axiosLikeError(403, 'ADULT_VERIFICATION_ERROR_008'),
    ),
    true,
  )
})

test('other 403 codes and other statuses are ignored', async () => {
  const { isAdultVerificationRequiredError } = await loadModule()

  assert.equal(
    isAdultVerificationRequiredError(axiosLikeError(403, 'TOPIC_ROOM_ERROR_008')),
    false,
  )
  assert.equal(
    isAdultVerificationRequiredError(
      axiosLikeError(404, 'ADULT_VERIFICATION_ERROR_008'),
    ),
    false,
  )
})

test('errors without a response body are ignored', async () => {
  const { isAdultVerificationRequiredError } = await loadModule()

  assert.equal(isAdultVerificationRequiredError(new Error('network')), false)
  assert.equal(isAdultVerificationRequiredError({ response: {} }), false)
  assert.equal(isAdultVerificationRequiredError(null), false)
  assert.equal(isAdultVerificationRequiredError(undefined), false)
})

test('prompt context follows the rejected request path', async () => {
  const { getAdultVerificationContext } = await loadModule()

  // Writes have their own wording.
  assert.equal(getAdultVerificationContext('/api/v1/plus/reader/review'), 'writeReview')
  assert.equal(getAdultVerificationContext('/api/v1/plus/reader/board'), 'writePost')

  // Creating a room has its own wording; any room-scoped path is access.
  assert.equal(getAdultVerificationContext('/api/v1/topic-rooms'), 'createTopicRoom')
  assert.equal(getAdultVerificationContext('/api/v1/topic-rooms/'), 'createTopicRoom')
  assert.equal(getAdultVerificationContext('/api/v1/topic-rooms/5/join'), 'topicroom')
  assert.equal(getAdultVerificationContext('/api/v1/topic-rooms/today'), 'topicroom')
  assert.equal(getAdultVerificationContext('/api/v1/chat/rooms/5/messages'), 'topicroom')

  // Everything that only reads falls back to the default copy.
  assert.equal(getAdultVerificationContext('/api/v1/works/3'), 'read')
  assert.equal(getAdultVerificationContext('/api/v1/works/3/review'), 'read')
  assert.equal(getAdultVerificationContext('/api/v1/works/review/12'), 'read')
  assert.equal(getAdultVerificationContext('/api/v1/favorite/works/3'), 'read')
  assert.equal(getAdultVerificationContext('/api/v1/feed/reader/board/7'), 'read')
  assert.equal(getAdultVerificationContext(undefined), 'read')
})

test('only a transition into VERIFIED counts as newly verified', async () => {
  const { isNewlyVerified } = await loadModule()

  assert.equal(isNewlyVerified('NOT_VERIFIED', 'VERIFIED'), true)
  assert.equal(isNewlyVerified('EXPIRED', 'VERIFIED'), true)
  // Status not loaded yet (e.g. startup read failed) still refreshes.
  assert.equal(isNewlyVerified(null, 'VERIFIED'), true)
  assert.equal(isNewlyVerified(undefined, 'VERIFIED'), true)

  // Repeated syncs of an already verified user must not refetch the app.
  assert.equal(isNewlyVerified('VERIFIED', 'VERIFIED'), false)
  assert.equal(isNewlyVerified('NOT_VERIFIED', 'NOT_VERIFIED'), false)
  assert.equal(isNewlyVerified('VERIFIED', 'EXPIRED'), false)
})
