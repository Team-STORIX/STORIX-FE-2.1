const assert = require('node:assert/strict')
const test = require('node:test')

const loadSchema = () => import('../plus.schema.ts')

/**
 * Captured from dev on 2026-09-23 with an unverified tester account
 * (GET /api/v1/plus/reader/works?keyword=은밀). The server keeps the name and
 * artist of a blinded adult work and nulls only the thumbnail.
 */
const blindedRow = {
  worksId: 1368,
  worksName: '버림받은 왕녀의 은밀한 침실',
  artistName: '혜니',
  reviewsCount: 0,
  avgRating: 0,
  thumbnailUrl: null,
  worksType: '웹툰',
  isAdultOnly: true,
  isBlinded: true,
}

const visibleRow = {
  worksId: 1461,
  worksName: '은밀한 재택근무',
  artistName: '굴닭',
  reviewsCount: 0,
  avgRating: 0,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  worksType: '웹툰',
  isAdultOnly: false,
  isBlinded: false,
}

test('a blinded work parses with its null thumbnail', async () => {
  const { PlusWorksSearchItemSchema } = await loadSchema()

  const parsed = PlusWorksSearchItemSchema.parse(blindedRow)

  assert.equal(parsed.thumbnailUrl, null)
  assert.equal(parsed.worksName, '버림받은 왕녀의 은밀한 침실')
  assert.equal(parsed.isBlinded, true)
})

test('a blinded row does not take the rest of the page with it', async () => {
  const { PlusWorksSearchResponseSchema } = await loadSchema()

  const parsed = PlusWorksSearchResponseSchema.parse({
    isSuccess: true,
    code: 'PLUS_SUCCESS_003',
    message: '작품 정보 조회에 성공했습니다.',
    result: { result: { content: [visibleRow, blindedRow], last: true, empty: false } },
  })

  assert.equal(parsed.result.content.length, 2)
})

test('a missing thumbnail key is still accepted', async () => {
  const { PlusWorksSearchItemSchema } = await loadSchema()

  const { thumbnailUrl: _omitted, ...withoutThumbnail } = blindedRow
  assert.equal(
    PlusWorksSearchItemSchema.parse(withoutThumbnail).thumbnailUrl,
    undefined,
  )
})
