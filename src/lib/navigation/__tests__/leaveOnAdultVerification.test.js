const assert = require('node:assert/strict')
const test = require('node:test')

const loadModule = () => import('../leaveOnAdultVerification.ts')

const input = (overrides) => ({
  hasRequiredError: true,
  isFocused: true,
  isVerified: false,
  alreadyLeft: false,
  ...overrides,
})

test('the focused screen leaves on the adult verification error', async () => {
  const { shouldLeaveForAdultVerification } = await loadModule()

  assert.equal(shouldLeaveForAdultVerification(input()), true)
})

test('a screen left mounted underneath never navigates', async () => {
  const { shouldLeaveForAdultVerification } = await loadModule()

  // The user opened the verification screen from the prompt; a late retry
  // failure must not pop it.
  assert.equal(
    shouldLeaveForAdultVerification(input({ isFocused: false })),
    false,
  )
})

test('a verified user stays while the data refetches', async () => {
  const { shouldLeaveForAdultVerification } = await loadModule()

  assert.equal(
    shouldLeaveForAdultVerification(input({ isVerified: true })),
    false,
  )
})

test('other errors and a second run do not navigate', async () => {
  const { shouldLeaveForAdultVerification } = await loadModule()

  assert.equal(
    shouldLeaveForAdultVerification(input({ hasRequiredError: false })),
    false,
  )
  assert.equal(
    shouldLeaveForAdultVerification(input({ alreadyLeft: true })),
    false,
  )
})
