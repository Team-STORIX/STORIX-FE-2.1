import { create } from 'zustand'
import type { MeProfileResult } from '../../../types/profile'

type ProfileState = {
  me: MeProfileResult | null
}

type ProfileActions = {
  setMe: (me: MeProfileResult) => void
  patchMe: (partial: Partial<MeProfileResult>) => void
  clearMe: () => void
}

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
  me: null,

  setMe: (me) => set({ me }),

  patchMe: (partial) => {
    const prev = get().me
    if (!prev) return
    set({ me: { ...prev, ...partial } })
  },

  clearMe: () => set({ me: null }),
}))
