import { useQuery } from '@tanstack/react-query'
import { getOnboardingWorks, onboardingKeys } from '../api'

/** 관심 작품 후보 목록. 온보딩 토큰이 있을 때만 조회하고 매번 새로 받는다. */
export function useOnboardingWorks(enabled: boolean) {
  return useQuery({
    queryKey: onboardingKeys.works,
    queryFn: getOnboardingWorks,
    enabled,
    staleTime: 0,
  })
}
