const assert = require('node:assert/strict')
const test = require('node:test')

const loadModule = () => import('../otherUserProfileError.ts')

const axiosLikeError = (status, code) => ({
  response: { status, data: { code } },
})

test('the three documented codes map to their screen states', async () => {
  const { getOtherUserProfileError } = await loadModule()

  assert.equal(getOtherUserProfileError(axiosLikeError(400, 'PROFILE_ERROR_002')), 'self')
  assert.equal(getOtherUserProfileError(axiosLikeError(403, 'BLOCK_ERROR_003')), 'blocked')
  assert.equal(getOtherUserProfileError(axiosLikeError(404, 'USER_ERROR_007')), 'unavailable')
})

test('adult verification 403 is left to the axios interceptor', async () => {
  const { getOtherUserProfileError } = await loadModule()

  assert.equal(
    getOtherUserProfileError(axiosLikeError(403, 'ADULT_VERIFICATION_ERROR_008')),
    null,
  )
})

test('a known code with the wrong status and malformed errors are ignored', async () => {
  const { getOtherUserProfileError } = await loadModule()

  assert.equal(getOtherUserProfileError(axiosLikeError(500, 'USER_ERROR_007')), null)
  assert.equal(getOtherUserProfileError(new Error('network')), null)
  assert.equal(getOtherUserProfileError(null), null)
})
