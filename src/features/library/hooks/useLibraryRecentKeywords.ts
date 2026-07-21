import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteLibraryRecentKeyword,
  getLibraryRecentKeywords,
} from '../api/library.api'

export const libraryRecentKeywordsQueryKey = [
  'library',
  'search',
  'recent',
] as const
type LibraryRecentKeywords = Awaited<ReturnType<typeof getLibraryRecentKeywords>>

export const useLibraryRecentKeywords = () =>
  useQuery({
    queryKey: libraryRecentKeywordsQueryKey,
    queryFn: getLibraryRecentKeywords,
    staleTime: 60_000,
    retry: false,
  })

export const useDeleteLibraryRecentKeyword = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyword: string) => deleteLibraryRecentKeyword({ keyword }),
    onMutate: async (keyword) => {
      await queryClient.cancelQueries({
        queryKey: libraryRecentKeywordsQueryKey,
      })

      const previousKeywords =
        queryClient.getQueryData<LibraryRecentKeywords>(
          libraryRecentKeywordsQueryKey,
        )

      queryClient.setQueryData<LibraryRecentKeywords>(
        libraryRecentKeywordsQueryKey,
        (current) => ({
          recentKeywords:
            current?.recentKeywords.filter((item) => item !== keyword) ?? [],
        }),
      )

      return { previousKeywords }
    },
    onError: (_error, _keyword, context) => {
      if (context?.previousKeywords) {
        queryClient.setQueryData(
          libraryRecentKeywordsQueryKey,
          context.previousKeywords,
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: libraryRecentKeywordsQueryKey,
      })
    },
  })
}
