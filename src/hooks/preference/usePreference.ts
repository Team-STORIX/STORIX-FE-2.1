import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPreferenceExploration,
  getPreferenceResults,
  getPreferenceStats,
  postPreferenceAnalyze,
} from '../../lib/api/preference/preference.api'
import type { PreferenceAnalyzeRequest } from '../../lib/api/preference/preference.schema'

export const usePreferenceExploration = (enabled = true) =>
  useQuery({
    queryKey: ['preference', 'exploration'],
    queryFn: getPreferenceExploration,
    enabled,
    staleTime: 0,
  })

export const usePreferenceResults = (enabled = true) =>
  useQuery({
    queryKey: ['preference', 'results'],
    queryFn: getPreferenceResults,
    enabled,
    staleTime: 0,
  })

export const usePreferenceStats = (enabled = true) =>
  useQuery({
    queryKey: ['preference', 'stats'],
    queryFn: getPreferenceStats,
    enabled,
    staleTime: 0,
  })

export const usePreferenceAnalyze = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: PreferenceAnalyzeRequest) => postPreferenceAnalyze(p),
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['preference', 'results'] })
      await qc.invalidateQueries({ queryKey: ['preference', 'stats'] })
    },
  })
}
