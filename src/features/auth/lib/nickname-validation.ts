export const NICKNAME_MESSAGES = {
  available: '사용 가능한 닉네임이에요.',
  duplicated: '이미 사용 중인 닉네임이에요.',
  invalidFormat: '한글, 영문, 숫자만 사용해 2~10자로 입력해 주세요.',
  forbidden: '사용할 수 없는 닉네임이에요',
  unknownError: '잠시 후 다시 시도해 주세요',
} as const

const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9]+$/
const NICKNAME_MIN_LENGTH = 2
const NICKNAME_MAX_LENGTH = 10

export const isValidNicknameFormat = (nickname: string): boolean => {
  if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
    return false
  }

  return NICKNAME_PATTERN.test(nickname)
}

export const getNicknameFormatErrorMessage = (nickname: string): string | null => {
  if (nickname.length === 0) return null
  return isValidNicknameFormat(nickname) ? null : NICKNAME_MESSAGES.invalidFormat
}

export const getNicknameFallbackErrorMessage = (message?: string): string =>
  message?.trim() || NICKNAME_MESSAGES.unknownError
