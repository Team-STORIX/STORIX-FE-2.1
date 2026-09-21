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
