export function formatCreatedAtLabel(value?: string | null) {
  const text = value?.trim()
  if (!text) return ''

  const isoDate = text.match(/^(\d{4}-\d{1,2}-\d{1,2})T\d{1,2}:\d{2}/)
  if (isoDate) return isoDate[1]

  const separatedDate = text.match(
    /^(\d{4}[./-]\d{1,2}[./-]\d{1,2}\.?)(?:\s+\d{1,2}:\d{2})/,
  )
  if (separatedDate) return separatedDate[1]

  return text
}
