import { useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  favoriteWork,
  getFavoriteWorkStatus,
  unfavoriteWork,
} from '../../lib/api/favorite/favorite.api'

type UseFavoriteWorkOptions = {
  onAdded?: (worksId: number) => void
  onRemoved?: (worksId: number) => void
}

export function useFavoriteWork(
  worksId?: number,
  options?: UseFavoriteWorkOptions,
) {
  const queryClient = useQueryClient()
  const enabled =
    typeof worksId === 'number' && Number.isFinite(worksId) && worksId > 0
  const queryKey = useMemo(
    () => ['favorite', 'works', 'status', worksId] as const,
    [worksId],
  )
  // Keep options in a ref so they don't trigger useEffect reruns.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const statusQuery = useQuery({
    queryKey,
    queryFn: () => getFavoriteWorkStatus(worksId!),
    enabled,
  })

  const addMutation = useMutation({ mutationFn: () => favoriteWork(worksId!) })
  const removeMutation = useMutation({ mutationFn: () => unfavoriteWork(worksId!) })

  useEffect(() => {
    if (!enabled) return
    if (addMutation.isSuccess) {
      optionsRef.current?.onAdded?.(worksId!)
      queryClient.invalidateQueries({ queryKey })
      addMutation.reset()
    }
    if (removeMutation.isSuccess) {
      optionsRef.current?.onRemoved?.(worksId!)
      queryClient.invalidateQueries({ queryKey })
      removeMutation.reset()
    }
  }, [
    enabled,
    worksId,
    addMutation,
    addMutation.isSuccess,
    removeMutation,
    removeMutation.isSuccess,
    queryClient,
    queryKey,
  ])

  const toggleFavorite = async () => {
    if (!enabled) return
    if (statusQuery.data ?? false) {
      await removeMutation.mutateAsync()
    } else {
      await addMutation.mutateAsync()
    }
  }

  return {
    isFavorite: statusQuery.data ?? false,
    isLoading: statusQuery.isLoading,
    isMutating: addMutation.isPending || removeMutation.isPending,
    toggleFavorite,
  }
}
