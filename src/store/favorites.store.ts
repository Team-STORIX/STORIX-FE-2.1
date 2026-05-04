import { create } from 'zustand'
import { getItem, setItem, removeItem } from '../lib/storage/async'

const FAVORITES_KEY = 'favorites'

// Stored as string[] in AsyncStorage; loaded into a Record for O(1) lookups.

type FavoritesState = {
  favoritedIds: Record<string, true>
}

type FavoritesActions = {
  /** Seed from AsyncStorage on app startup. */
  hydrateFavorites: () => Promise<void>
  /** Toggle favorite state and persist to AsyncStorage. */
  toggleFavorite: (id: string) => Promise<void>
  /** Synchronous check — safe to call in render. */
  isFavorited: (id: string) => boolean
  /** Wipe in-memory state and remove persisted key. Called by clearAuth. */
  clearFavorites: () => Promise<void>
}

export const useFavoritesStore = create<FavoritesState & FavoritesActions>((set, get) => ({
  favoritedIds: {},

  hydrateFavorites: async () => {
    const ids = await getItem<string[]>(FAVORITES_KEY)
    if (!ids) return
    const favoritedIds: Record<string, true> = {}
    for (const id of ids) favoritedIds[id] = true
    set({ favoritedIds })
  },

  toggleFavorite: async (id) => {
    const prev = get().favoritedIds
    const next = { ...prev }
    if (next[id]) {
      delete next[id]
    } else {
      next[id] = true
    }
    set({ favoritedIds: next })
    await setItem(FAVORITES_KEY, Object.keys(next))
  },

  isFavorited: (id) => !!get().favoritedIds[id],

  clearFavorites: async () => {
    set({ favoritedIds: {} })
    await removeItem(FAVORITES_KEY)
  },
}))
