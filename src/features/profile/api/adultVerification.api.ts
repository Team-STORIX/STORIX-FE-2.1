import { isAxiosError } from 'axios'

import { apiClient } from '../../../lib/api/axios-instance'
import {
  ADULT_VERIFICATION_REQUIRED_CODE,
  isNewlyVerified,
} from '../../../lib/api/adultVerificationRequired'
import { queryClient } from '../../../lib/query/queryClient'
import { useAdultVerificationStore } from '../../../store/adultVerification.store'
import {
  AdultVerificationStatusResponseSchema,
  AdultVerificationTicketResponseSchema,
  type AdultVerificationStatus,
  type AdultVerificationTicket,
} from './adultVerification.schema'

const BASE_PATH = '/api/v1/adult-verifications'

export const ADULT_VERIFICATION_ERROR_CODES = {
  unknownVerification: 'ADULT_VERIFICATION_ERROR_001',
  expiredVerification: 'ADULT_VERIFICATION_ERROR_002',
  requesterMismatch: 'ADULT_VERIFICATION_ERROR_003',
  incompleteVerification: 'ADULT_VERIFICATION_ERROR_004',
  underage: 'ADULT_VERIFICATION_ERROR_005',
  missingBirthDate: 'ADULT_VERIFICATION_ERROR_006',
  providerFailure: 'ADULT_VERIFICATION_ERROR_007',
  verificationRequired: ADULT_VERIFICATION_REQUIRED_CODE,
  alreadyVerified: 'ADULT_VERIFICATION_ERROR_009',
} as const

type ApiErrorBody = {
  code?: unknown
  message?: unknown
}

export class AdultVerificationApiError extends Error {
  readonly code?: string
  readonly status?: number

  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'AdultVerificationApiError'
    this.code = code
    this.status = status
  }
}

type ShareStatusOptions = {
  /**
   * Refetch everything once the user becomes verified, so screens that failed
   * with 403 recover when the user comes back. The startup bootstrap turns
   * it off, which would otherwise refetch the whole app on every launch.
   */
  refreshOnVerified?: boolean
}

const shareStatus = (
  status: AdultVerificationStatus,
  { refreshOnVerified = true }: ShareStatusOptions = {},
): AdultVerificationStatus => {
  const store = useAdultVerificationStore.getState()
  const previousState = store.status?.state
  store.setStatus(status)

  if (refreshOnVerified && isNewlyVerified(previousState, status.state)) {
    void queryClient.invalidateQueries()
  }
  return status
}

const toAdultVerificationError = (error: unknown): Error => {
  if (error instanceof AdultVerificationApiError) return error

  if (isAxiosError<ApiErrorBody>(error)) {
    const code =
      typeof error.response?.data?.code === 'string'
        ? error.response.data.code
        : undefined
    const message =
      typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : '성인인증 요청을 처리할 수 없어요.'

    return new AdultVerificationApiError(
      message,
      code,
      error.response?.status,
    )
  }

  return error instanceof Error
    ? error
    : new Error('성인인증 요청을 처리할 수 없어요.')
}

export const getAdultVerificationErrorCode = (
  error: unknown,
): string | undefined =>
  error instanceof AdultVerificationApiError ? error.code : undefined

export async function getAdultVerificationStatus(
  options?: ShareStatusOptions,
): Promise<AdultVerificationStatus> {
  try {
    const { data } = await apiClient.get(`${BASE_PATH}/me`)
    return shareStatus(
      AdultVerificationStatusResponseSchema.parse(data).result,
      options,
    )
  } catch (error) {
    throw toAdultVerificationError(error)
  }
}

export async function syncAdultVerification(): Promise<AdultVerificationStatus> {
  try {
    const { data } = await apiClient.post(`${BASE_PATH}/sync`)
    return shareStatus(AdultVerificationStatusResponseSchema.parse(data).result)
  } catch (error) {
    throw toAdultVerificationError(error)
  }
}
export async function issueAdultVerification(): Promise<AdultVerificationTicket> {
  try {
    const { data } = await apiClient.post(BASE_PATH)
    return AdultVerificationTicketResponseSchema.parse(data).result
  } catch (error) {
    throw toAdultVerificationError(error)
  }
}

export async function confirmAdultVerification(
  identityVerificationId: string,
): Promise<AdultVerificationStatus> {
  try {
    const { data } = await apiClient.post(`${BASE_PATH}/confirm`, {
      identityVerificationId,
    })
    return shareStatus(AdultVerificationStatusResponseSchema.parse(data).result)
  } catch (error) {
    throw toAdultVerificationError(error)
  }
}
