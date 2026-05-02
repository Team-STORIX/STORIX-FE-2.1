import { useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  favoriteWork,
  getFavoriteWorkStatus,
  unfavoriteWork,
} from '../api/favorite.api'
import { useFavoritesStore } from '../../../store/favorites.store'

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
    // Guard: do not toggle before the server state is known.
    if (!enabled || !statusQuery.isSuccess) return

    const id = String(worksId!)
    const currentIsFav = statusQuery.data

    // Optimistic: flip the store immediately so any screen reading
    // useFavoritesStore.isFavorited() reflects the change before the API responds.
    void useFavoritesStore.getState().toggleFavorite(id)

    try {
      if (currentIsFav) {
        await removeMutation.mutateAsync()
      } else {
        await addMutation.mutateAsync()
      }
    } catch {
      // Revert the store so it stays in sync with the server truth.
      void useFavoritesStore.getState().toggleFavorite(id)
    }
  }

  return {
    isFavorite: statusQuery.data ?? false,
    isLoading: statusQuery.isLoading,
    isMutating: addMutation.isPending || removeMutation.isPending,
    toggleFavorite,
  }
}
