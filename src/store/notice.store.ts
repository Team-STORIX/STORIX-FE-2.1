import { create } from 'zustand'

// App-wide notices raised outside any screen (e.g. from the axios interceptor).
// Screen-specific toasts keep their own local state.

type NoticeState = {
  message: string | null
}

type NoticeActions = {
  /** Shows the notice; repeating the one already on screen is a no-op. */
  showNotice: (message: string) => void
  clearNotice: () => void
}

export const useNoticeStore = create<NoticeState & NoticeActions>((set, get) => ({
  message: null,
  showNotice: (message) => {
    if (get().message === message) return
    set({ message })
  },
  clearNotice: () => set({ message: null }),
}))
