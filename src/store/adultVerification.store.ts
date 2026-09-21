import { create } from 'zustand'

import type { AdultVerificationStatus } from '../features/profile/api/adultVerification.schema'

type AdultVerificationState = {
  /** Last status returned by the server. null until first fetched. */
  status: AdultVerificationStatus | null
  /** Whether the "verification required" prompt is showing. */
  promptVisible: boolean
}

type AdultVerificationActions = {
  setStatus: (status: AdultVerificationStatus) => void
  showPrompt: () => void
  hidePrompt: () => void
  /** Wipe in-memory state. Called by clearAuth. */
  clear: () => void
}

export const useAdultVerificationStore = create<
  AdultVerificationState & AdultVerificationActions
>((set) => ({
  status: null,
  promptVisible: false,

  setStatus: (status) => set({ status }),
  showPrompt: () => set((state) => (state.promptVisible ? state : { promptVisible: true })),
  hidePrompt: () => set({ promptVisible: false }),
  clear: () => set({ status: null, promptVisible: false }),
}))

/** Server-confirmed verification. False while the status is unknown. */
export const useIsAdultVerified = (): boolean =>
  useAdultVerificationStore((state) => state.status?.state === 'VERIFIED')
