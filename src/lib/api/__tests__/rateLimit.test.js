const assert = require('node:assert/strict')
const test = require('node:test')

const loadModule = () => import('../rateLimit.ts')

test('a 429 is rate limited with or without the documented code', async () => {
  const { isRateLimitedError } = await loadModule()

  assert.equal(
    isRateLimitedError({ response: { status: 429, data: { code: 'COMMON_ERROR_012' } } }),
    true,
  )
  assert.equal(isRateLimitedError({ response: { status: 429, data: '' } }), true)
})

test('other failures are not rate limited', async () => {
  const { isRateLimitedError } = await loadModule()

  assert.equal(isRateLimitedError({ response: { status: 403, data: { code: 'BLOCK_ERROR_003' } } }), false)
  assert.equal(isRateLimitedError(new Error('network')), false)
  assert.equal(isRateLimitedError(null), false)
})
