const assert = require('node:assert/strict')
const test = require('node:test')
const vm = require('node:vm')

const loadSecurityModule = () => import('../webViewSecurity.ts')

test('all WebView navigation reaches the single policy gate', async () => {
  const {
    APP_EVENT_WEBVIEW_ORIGIN_WHITELIST,
    shouldAllowAppEventWebViewNavigation,
  } = await loadSecurityModule()
  const externalUrls = []
  const blockedReasons = []
  const handlers = {
    openExternal: (url) => externalUrls.push(url),
    onBlocked: (reason) => blockedReasons.push(reason),
  }
  const origins = ['https://storix.kr']

  assert.deepEqual(APP_EVENT_WEBVIEW_ORIGIN_WHITELIST, ['*'])
  assert.equal(
    shouldAllowAppEventWebViewNavigation(
      'https://storix.kr/event/12/result',
      origins,
      handlers,
    ),
    true,
  )
  assert.equal(
    shouldAllowAppEventWebViewNavigation(
      'https://example.com',
      origins,
      handlers,
    ),
    false,
  )
  assert.equal(
    shouldAllowAppEventWebViewNavigation(
      'intent://works/12',
      origins,
      handlers,
    ),
    false,
  )

  assert.deepEqual(externalUrls, ['https://example.com'])
  assert.deepEqual(blockedReasons, ['UNSUPPORTED_SCHEME'])
})

test('auth injection replaces a stale token with null on logout', async () => {
  const { createAppEventAuthInjectionScript } = await loadSecurityModule()
  const authEvents = []
  const context = {
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type
        this.detail = init.detail
      }
    },
    window: {
      location: { origin: 'https://storix.kr' },
      dispatchEvent: (event) => authEvents.push(event),
    },
  }
  const origins = ['https://storix.kr']

  vm.runInNewContext(
    createAppEventAuthInjectionScript('old-token', origins),
    context,
  )
  vm.runInNewContext(
    createAppEventAuthInjectionScript(null, origins),
    context,
  )

  assert.equal(context.window.__STORIX_AUTH__.accessToken, null)
  assert.deepEqual(
    authEvents.map((event) => event.detail.accessToken),
    ['old-token', null],
  )
})

test('auth injection does nothing on an untrusted document', async () => {
  const { createAppEventAuthInjectionScript } = await loadSecurityModule()
  const context = {
    CustomEvent: class CustomEvent {},
    window: {
      location: { origin: 'https://evil.example' },
      dispatchEvent: () => assert.fail('must not dispatch auth to an untrusted page'),
    },
  }

  vm.runInNewContext(
    createAppEventAuthInjectionScript('secret-token', ['https://storix.kr']),
    context,
  )

  assert.equal(context.window.__STORIX_AUTH__, undefined)
})
