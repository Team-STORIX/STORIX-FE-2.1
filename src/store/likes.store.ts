import { create } from 'zustand'
import { getItem, setItem, removeItem } from '../lib/storage/async'

const LIKES_KEY = 'likes'

// Stored as string[] in AsyncStorage; loaded into a Record for O(1) lookups.

type LikesState = {
  likedIds: Record<string, true>
}

type LikesActions = {
  /** Seed from AsyncStorage on app startup. */
  hydrateLikes: () => Promise<void>
  /** Toggle like state and persist to AsyncStorage. */
  toggleLike: (id: string) => Promise<void>
  /** Synchronous check — safe to call in render. */
  isLiked: (id: string) => boolean
  /** Wipe in-memory state and remove persisted key. Called by clearAuth. */
  clearLikes: () => Promise<void>
}

export const useLikesStore = create<LikesState & LikesActions>((set, get) => ({
  likedIds: {},

  hydrateLikes: async () => {
    const ids = await getItem<string[]>(LIKES_KEY)
    if (!ids) return
    const likedIds: Record<string, true> = {}
    for (const id of ids) likedIds[id] = true
    set({ likedIds })
  },

  toggleLike: async (id) => {
    const prev = get().likedIds
    const next = { ...prev }
    if (next[id]) {
      delete next[id]
    } else {
      next[id] = true
    }
    set({ likedIds: next })
    await setItem(LIKES_KEY, Object.keys(next))
  },

  isLiked: (id) => !!get().likedIds[id],

  clearLikes: async () => {
    set({ likedIds: {} })
    await removeItem(LIKES_KEY)
  },
}))
