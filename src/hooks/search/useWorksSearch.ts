import { useQuery } from '@tanstack/react-query'
import { getWorksSearch } from '../../lib/api/search/search.api'
import type {
  SearchGenre,
  SearchWorksType,
  WorksSort,
} from '../../lib/api/search/search.schema'

export function useWorksSearch(params: {
  keyword: string
  sort?: WorksSort
  page?: number
  worksTypes?: SearchWorksType[]
  genres?: SearchGenre[]
}) {
  const { keyword, sort = 'NAME', page = 0, worksTypes = [], genres = [] } = params
  const k = keyword.trim()

  return useQuery({
    queryKey: ['search', 'works', k, sort, page, worksTypes, genres],
    enabled: !!k,
    retry: false,
    queryFn: () => getWorksSearch({ keyword: k, sort, page, worksTypes, genres }),
  })
}
