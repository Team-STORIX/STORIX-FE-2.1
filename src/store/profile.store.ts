import { create } from 'zustand'
import type { MeProfileResult } from '../types/profile'

// In-memory only — no persistence middleware.
// Profile data is fetched fresh from the API on each app start.
// Cached here for the lifetime of the process so screens don't re-fetch unnecessarily.

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
