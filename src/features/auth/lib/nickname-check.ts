import {
  checkNicknameValid,
  extractIsAvailableFromValidResponse,
  extractIsDuplicatedFromValidResponse,
  extractIsForbiddenFromValidResponse,
} from '../api/nickname.api'
import {
  getNicknameFallbackErrorMessage,
  getNicknameFormatErrorMessage,
  NICKNAME_MESSAGES,
} from './nickname-validation'

export type NicknameCheckStatus = 'idle' | 'ok' | 'taken' | 'invalid' | 'forbidden' | 'error'

export type NicknameCheckResult = {
  status: NicknameCheckStatus
  message: string
}

export const isNicknameCheckError = (status: NicknameCheckStatus) =>
  status === 'taken' || status === 'invalid' || status === 'forbidden' || status === 'error'

/**
 * 온보딩 닉네임 중복 확인.
 * 형식 검사를 먼저 하고, 통과하면 서버에 사용 가능 여부를 묻는다.
 * 결과는 화면 상태(status)와 안내 문구(message)로 바로 쓸 수 있는 형태로 돌려준다.
 */
export async function checkOnboardingNickname(nickname: string): Promise<NicknameCheckResult> {
  const formatErrorMessage = getNicknameFormatErrorMessage(nickname)
  if (formatErrorMessage) {
    return { status: 'invalid', message: formatErrorMessage }
  }

  try {
    const response = await checkNicknameValid(nickname)
    if (extractIsAvailableFromValidResponse(response)) {
      return { status: 'ok', message: NICKNAME_MESSAGES.available }
    }
    if (extractIsDuplicatedFromValidResponse(response)) {
      return { status: 'taken', message: NICKNAME_MESSAGES.duplicated }
    }
    if (extractIsForbiddenFromValidResponse(response)) {
      return { status: 'forbidden', message: NICKNAME_MESSAGES.forbidden }
    }
    return { status: 'error', message: getNicknameFallbackErrorMessage(response.message) }
  } catch {
    return { status: 'error', message: NICKNAME_MESSAGES.unknownError }
  }
}
