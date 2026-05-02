// src/features/preference/api/preference.api.ts
import { apiClient } from '../../../lib/api/axios-instance'
import {
  PreferenceAnalyzeResponseSchema,
  PreferenceExplorationResponseSchema,
  PreferenceResultsResponseSchema,
  PreferenceStatsResponseSchema,
  type PreferenceAnalyzeRequest,
} from './preference.schema'

/** GET /api/v1/preference/exploration — 취향탐색 작품 리스트 */
export async function getPreferenceExploration() {
  const { data } = await apiClient.get('/api/v1/preference/exploration')
  return PreferenceExplorationResponseSchema.parse(data)
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
