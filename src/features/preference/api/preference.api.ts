// src/features/preference/api/preference.api.ts
import { isAxiosError } from 'axios'
import { apiClient } from '../../../lib/api/axios-instance'
import {
  PreferenceAnalyzeResponseSchema,
  PreferenceResultsResponseSchema,
  PreferenceStatsResponseSchema,
  normalizePreferenceExploration,
  type PreferenceAnalyzeRequest,
  type PreferenceExplorationWork,
} from './preference.schema'

type ApiErrorPayload = {
  code?: string
  message?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const getStringField = (
  value: Record<string, unknown>,
  key: string,
): string | undefined => {
  const field = value[key]
  return typeof field === 'string' ? field : undefined
}

const getApiErrorPayload = (error: unknown): ApiErrorPayload | undefined => {
  if (error instanceof PreferenceExplorationApiError) {
    return { code: error.code, message: error.apiMessage }
  }

  if (isAxiosError(error) && isRecord(error.response?.data)) {
    return {
      code: getStringField(error.response.data, 'code'),
      message: getStringField(error.response.data, 'message'),
    }
  }

  return undefined
}

export class PreferenceExplorationApiError extends Error {
  code?: string
  apiMessage?: string
  raw: unknown

  constructor(payload: ApiErrorPayload, raw: unknown) {
    super(payload.message || payload.code || 'Preference exploration failed.')
    this.name = 'PreferenceExplorationApiError'
    this.code = payload.code
    this.apiMessage = payload.message
    this.raw = raw
  }
}

export const isPreferenceDailyLimitError = (error: unknown): boolean => {
  const payload = getApiErrorPayload(error)
  if (!payload) return false

  const code = payload.code?.toUpperCase() ?? ''
  const message = payload.message ?? ''

  return (
    [
      'PREFERENCE_ALREADY_DONE',
      'PREFERENCE_LIMIT_EXCEEDED',
      'PREFERENCE_DAILY_LIMIT',
      'PREFERENCE_DAILY_LIMIT_EXCEEDED',
      'PREFERENCE_EXPLORATION_ALREADY_DONE',
    ].includes(code) ||
    (code.includes('PREFERENCE') &&
      /(ALREADY|LIMIT|DAILY|DONE|EXCEEDED|COMPLETE)/.test(code)) ||
    /하루|한\s*번|이미|오늘.*완료|내일/.test(message)
  )
}

/** GET /api/v1/preference/exploration — 취향탐색 작품 리스트 */
export async function getPreferenceExploration(): Promise<
  PreferenceExplorationWork[]
> {
  const { data } = await apiClient.get('/api/v1/preference/exploration')

  if (isRecord(data) && data.isSuccess === false) {
    throw new PreferenceExplorationApiError(
      {
        code: getStringField(data, 'code'),
        message: getStringField(data, 'message'),
      },
      data,
    )
  }

  return normalizePreferenceExploration(data)
}

/** POST /api/v1/preference/exploration — 작품 like/dislike 기록 */
export async function postPreferenceAnalyze(payload: PreferenceAnalyzeRequest) {
  const { data } = await apiClient.post('/api/v1/preference/exploration', payload)
  return PreferenceAnalyzeResponseSchema.parse(data)
}

/** GET /api/v1/preference/stats — 선호 장르 통계 */
export async function getPreferenceStats() {
  const { data } = await apiClient.get('/api/v1/preference/stats')
  return PreferenceStatsResponseSchema.parse(data)
}

/** GET /api/v1/preference/results — 취향 분석 결과 */
export async function getPreferenceResults() {
  const { data } = await apiClient.get('/api/v1/preference/results')
  return PreferenceResultsResponseSchema.parse(data)
}
