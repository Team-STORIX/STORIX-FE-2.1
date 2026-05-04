import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteLibraryRecentKeyword,
  getLibraryRecentKeywords,
} from '../api/library.api'

export const useLibraryRecentKeywords = () =>
  useQuery({
    queryKey: ['libraryRecentKeywords'],
    queryFn: getLibraryRecentKeywords,
    staleTime: 60_000,
  })

export const useDeleteLibraryRecentKeyword = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keyword: string) => deleteLibraryRecentKeyword({ keyword }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['libraryRecentKeywords'] })
    },
  })
}
