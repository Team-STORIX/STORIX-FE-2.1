import { useQuery } from '@tanstack/react-query'
import { getWorksDetail } from '../../lib/api/works/works.api'

export const useWorksDetail = (worksId: number) =>
  useQuery({
    queryKey: ['works', 'detail', worksId],
    enabled: Number.isFinite(worksId) && worksId > 0,
    queryFn: () => getWorksDetail(worksId),
  })
