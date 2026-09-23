const assert = require('node:assert/strict')
const test = require('node:test')

const loadLinkify = () => import('../linkify.ts')

test('a bare sentence produces a single plain segment', async () => {
  const { splitLinkSegments, hasLink } = await loadLinkify()

  assert.deepEqual(splitLinkSegments('오늘 읽은 작품 너무 좋았어요'), [
    { text: '오늘 읽은 작품 너무 좋았어요' },
  ])
  assert.equal(hasLink('오늘 읽은 작품 너무 좋았어요'), false)
})

test('a link is split out of the surrounding text', async () => {
  const { splitLinkSegments } = await loadLinkify()

  assert.deepEqual(splitLinkSegments('여기 https://storix.kr/works/1 보세요'), [
    { text: '여기 ' },
    { text: 'https://storix.kr/works/1', url: 'https://storix.kr/works/1' },
    { text: ' 보세요' },
  ])
})

test('a Korean particle written straight after a link is not swallowed', async () => {
  const { splitLinkSegments } = await loadLinkify()

  assert.deepEqual(splitLinkSegments('https://storix.kr에서 봤어요'), [
    { text: 'https://storix.kr', url: 'https://storix.kr' },
    { text: '에서 봤어요' },
  ])
})

test('a Korean path is never linked as a truncated prefix', async () => {
  const { splitLinkSegments } = await loadLinkify()

  // Linking the prefix here would open a different page than the one shared.
  for (const value of [
    'https://namu.wiki/w/전지적%20독자%20시점',
    'https://namu.wiki/w/전지적독자시점',
    'https://example.com/search?q=웹툰&page=2',
  ]) {
    assert.deepEqual(splitLinkSegments(value), [{ text: value }], value)
  }
})

test('a particle after a path does not block the link', async () => {
  const { splitLinkSegments } = await loadLinkify()

  assert.deepEqual(splitLinkSegments('https://storix.kr/works/1에서 봤어요'), [
    { text: 'https://storix.kr/works/1', url: 'https://storix.kr/works/1' },
    { text: '에서 봤어요' },
  ])
})

test('a question mark ending a Korean sentence is not read as a query', async () => {
  const { splitLinkSegments } = await loadLinkify()

  assert.deepEqual(splitLinkSegments('https://storix.kr에서요?'), [
    { text: 'https://storix.kr', url: 'https://storix.kr' },
    { text: '에서요?' },
  ])
})

test('sentence punctuation after a link stays in the sentence', async () => {
  const { splitLinkSegments } = await loadLinkify()

  assert.deepEqual(splitLinkSegments('링크는 https://storix.kr/a. 끝'), [
    { text: '링크는 ' },
    { text: 'https://storix.kr/a', url: 'https://storix.kr/a' },
    { text: '. 끝' },
  ])
})

test('a link wrapped in parentheses keeps its own balanced brackets', async () => {
  const { normalizeLinkUrl } = await loadLinkify()

  assert.equal(
    normalizeLinkUrl('https://ko.wikipedia.org/wiki/example_(film)'),
    'https://ko.wikipedia.org/wiki/example_(film)',
  )
  assert.equal(normalizeLinkUrl('https://storix.kr)'), 'https://storix.kr')
})

test('a www host is promoted to https', async () => {
  const { normalizeLinkUrl } = await loadLinkify()

  assert.equal(normalizeLinkUrl('www.storix.kr/a'), 'https://www.storix.kr/a')
})

test('non-http schemes are never linkable', async () => {
  const { normalizeLinkUrl, hasLink } = await loadLinkify()

  for (const value of [
    'javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'intent://scan#Intent;scheme=zxing;end',
    'file:///etc/passwd',
  ]) {
    assert.equal(normalizeLinkUrl(value), null, value)
    assert.equal(hasLink(value), false, value)
  }
})

test('a scheme embedded after a linkable prefix cannot smuggle a payload', async () => {
  const { splitLinkSegments } = await loadLinkify()

  // "https://" must start the match; the javascript: text stays inert.
  const segments = splitLinkSegments('javascript:alert(1) 그리고 https://storix.kr')
  assert.deepEqual(segments, [
    { text: 'javascript:alert(1) 그리고 ' },
    { text: 'https://storix.kr', url: 'https://storix.kr' },
  ])
})

test('decimal numbers and bare hosts are not mistaken for links', async () => {
  const { hasLink, normalizeLinkUrl } = await loadLinkify()

  assert.equal(hasLink('별점 3.5점 줬어요'), false)
  assert.equal(hasLink('storix.kr 에서 봤어요'), false)
  assert.equal(normalizeLinkUrl('https://localhost:8081'), null)
})

test('multiple links in one message are all detected', async () => {
  const { splitLinkSegments } = await loadLinkify()

  const segments = splitLinkSegments('https://a.example.com 그리고 www.b.example.com 둘 다')
  assert.deepEqual(
    segments.filter((segment) => segment.url != null).map((segment) => segment.url),
    ['https://a.example.com', 'https://www.b.example.com'],
  )
})

test('empty and non-string input is handled', async () => {
  const { splitLinkSegments, normalizeLinkUrl } = await loadLinkify()

  assert.deepEqual(splitLinkSegments(''), [])
  assert.equal(normalizeLinkUrl(null), null)
  assert.equal(normalizeLinkUrl(undefined), null)
  assert.equal(normalizeLinkUrl(42), null)
})
