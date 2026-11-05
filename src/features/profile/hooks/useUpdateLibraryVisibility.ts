import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MeProfileResult } from '../../../types/profile'
import { updateLibraryVisibility } from '../api/profile.api'
import { useProfileStore } from '../store/profile.store'
import { ME_QUERY_KEY } from './useMe'

/** Toggles whether other users can see my library, reflecting it on my profile right away. */
export function useUpdateLibraryVisibility() {
  const qc = useQueryClient()

  const applyToMe = (isLibraryPublic: boolean) => {
    const next = qc.setQueryData<MeProfileResult>(ME_QUERY_KEY, (current) =>
      current ? { ...current, isLibraryPublic } : current,
    )
    if (next) useProfileStore.getState().setMe(next)
  }

  return useMutation({
    mutationFn: updateLibraryVisibility,
    onMutate: async (isPublic: boolean) => {
      await qc.cancelQueries({ queryKey: ME_QUERY_KEY })
      const previous = qc.getQueryData<MeProfileResult>(ME_QUERY_KEY)
      applyToMe(isPublic)
      return { previous }
    },
    onError: (_error, _isPublic, context) => {
      if (context?.previous) applyToMe(context.previous.isLibraryPublic)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ME_QUERY_KEY })
    },
  })
}
