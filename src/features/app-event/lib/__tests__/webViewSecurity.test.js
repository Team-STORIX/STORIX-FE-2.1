const assert = require('node:assert/strict')
const test = require('node:test')

const loadSecurityModule = () => import('../webViewSecurity.ts')

test('production landing allows only the apex and www origins', async () => {
  const { buildAllowedLandingOrigins } = await loadSecurityModule()

  assert.deepEqual(
    buildAllowedLandingOrigins('https://storix.kr'),
    ['https://storix.kr', 'https://www.storix.kr'],
  )
})

test('preview landing allows only the configured exact origin', async () => {
  const { buildAllowedLandingOrigins } = await loadSecurityModule()

  assert.deepEqual(
    buildAllowedLandingOrigins('https://www-dev.storix.kr'),
    ['https://www-dev.storix.kr'],
  )
})

test('trusted navigation remains in the webview', async () => {
  const { classifyAppEventWebViewNavigation } = await loadSecurityModule()
  const decision = classifyAppEventWebViewNavigation(
    'https://storix.kr/event/12/result?step=2',
    ['https://storix.kr', 'https://www.storix.kr'],
  )

  assert.equal(decision.action, 'ALLOW_IN_WEBVIEW')
})

test('event entry validation is stricter than trusted in-webview navigation', async () => {
  const { isTrustedAppEventEntryUrl } = await loadSecurityModule()
  const origins = ['https://storix.kr', 'https://www.storix.kr']

  assert.equal(
    isTrustedAppEventEntryUrl('https://storix.kr/event/12?api=dev', origins),
    true,
  )
  assert.equal(
    isTrustedAppEventEntryUrl('https://storix.kr/event/12/result', origins),
    false,
  )
  assert.equal(
    isTrustedAppEventEntryUrl('https://evil.example/event/12', origins),
    false,
  )
})

test('lookalike and unconfigured preview origins are not trusted', async () => {
  const { isUrlFromAllowedOrigins } = await loadSecurityModule()
  const origins = ['https://storix.kr', 'https://www.storix.kr']

  assert.equal(
    isUrlFromAllowedOrigins('https://storix.kr.evil.example/event/12', origins),
    false,
  )
  assert.equal(
    isUrlFromAllowedOrigins('https://some-preview.vercel.app/event/12', origins),
    false,
  )
})

test('external https and supported system links leave the webview', async () => {
  const { classifyAppEventWebViewNavigation } = await loadSecurityModule()
  const origins = ['https://storix.kr']

  assert.equal(
    classifyAppEventWebViewNavigation('https://example.com/path', origins).action,
    'OPEN_EXTERNALLY',
  )
  assert.equal(
    classifyAppEventWebViewNavigation('mailto:help@storix.kr', origins).action,
    'OPEN_EXTERNALLY',
  )
  assert.equal(
    classifyAppEventWebViewNavigation('tel:0212345678', origins).action,
    'OPEN_EXTERNALLY',
  )
})

test('unsafe and malformed navigation is blocked', async () => {
  const { classifyAppEventWebViewNavigation } = await loadSecurityModule()
  const origins = ['https://storix.kr']

  assert.deepEqual(
    classifyAppEventWebViewNavigation('javascript:alert(1)', origins),
    { action: 'BLOCK', reason: 'UNSUPPORTED_SCHEME' },
  )
  assert.deepEqual(
    classifyAppEventWebViewNavigation('not a url', origins),
    { action: 'BLOCK', reason: 'INVALID_URL' },
  )
})
