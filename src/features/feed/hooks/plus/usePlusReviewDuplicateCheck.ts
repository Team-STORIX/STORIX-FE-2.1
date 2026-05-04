import { useQuery } from '@tanstack/react-query'
import { getPlusReviewDuplicate } from '../../api/plus/plus.api'

export function usePlusReviewDuplicateCheck(worksId?: number) {
  return useQuery({
    queryKey: ['plus', 'reviewDuplicate', worksId],
    queryFn: () => getPlusReviewDuplicate(worksId as number),
    enabled: !!worksId,
    retry: false,
    staleTime: 60_000,
  })
}
