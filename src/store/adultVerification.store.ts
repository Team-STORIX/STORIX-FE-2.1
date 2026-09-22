import { create } from 'zustand'

import type { AdultVerificationStatus } from '../features/profile/api/adultVerification.schema'

/**
 * Why the verification prompt was raised. Selects the modal body copy.
 * - read: opening adult posts or works (search, feed)
 * - topicroom: entering an adult topic room
 * - writeReview: writing a review for an adult work
 * - writePost: writing a feed post for an adult work
 */
export type AdultVerificationContext =
  | 'read'
  | 'topicroom'
  | 'writeReview'
  | 'writePost'

type AdultVerificationState = {
  /** Last status returned by the server. null until first fetched. */
  status: AdultVerificationStatus | null
  /** Whether the "verification required" prompt is showing. */
  promptVisible: boolean
  promptContext: AdultVerificationContext
}

type AdultVerificationActions = {
  setStatus: (status: AdultVerificationStatus) => void
  showPrompt: (context?: AdultVerificationContext) => void
  hidePrompt: () => void
  /** Wipe in-memory state. Called by clearAuth. */
  clear: () => void
}

export const useAdultVerificationStore = create<
  AdultVerificationState & AdultVerificationActions
>((set) => ({
  status: null,
  promptVisible: false,
  promptContext: 'read',

  setStatus: (status) => set({ status }),
  // The first caller wins while the prompt is open, so parallel 403s from
  // one screen do not swap the copy under the user.
  showPrompt: (context = 'read') =>
    set((state) =>
      state.promptVisible ? state : { promptVisible: true, promptContext: context },
    ),
  hidePrompt: () => set({ promptVisible: false }),
  clear: () => set({ status: null, promptVisible: false }),
}))

/** Server-confirmed verification. False while the status is unknown. */
export const useIsAdultVerified = (): boolean =>
  useAdultVerificationStore((state) => state.status?.state === 'VERIFIED')

/**
 * Whether adult-only content must be masked for the current user.
 * Single decision point so the rule can change in one place (e.g. if the
 * server-side isBlinded flag turns out to be the per-user answer).
 */
export const useShouldMaskAdultContent = (
  isAdultOnly: boolean | null | undefined,
): boolean => {
  const verified = useIsAdultVerified()
  return isAdultOnly === true && !verified
}

/** Same rule as useShouldMaskAdultContent, for event handlers. */
export const shouldMaskAdultContent = (
  isAdultOnly: boolean | null | undefined,
): boolean =>
  isAdultOnly === true &&
  useAdultVerificationStore.getState().status?.state !== 'VERIFIED'

