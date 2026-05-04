// src/features/topicroom/api/formatTopicRoomSubtitle.ts
export const formatTopicRoomSubtitle = (
  worksType?: string | null,
  worksName?: string | null,
) => {
  const rawType = (worksType ?? '').trim()

  //   영문 enum → 한글 라벨 통일
  const type =
    rawType === 'WEBTOON'
      ? '웹툰'
      : rawType === 'WEBNOVEL'
        ? '웹소설'
        : rawType || '작품'

  const name = (worksName ?? '').trim()
  return `${type} <${name}>`
}
