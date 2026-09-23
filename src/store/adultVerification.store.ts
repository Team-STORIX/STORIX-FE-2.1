import { create } from 'zustand'

import type { AdultVerificationStatus } from '../features/profile/api/adultVerification.schema'
import {
  isAdultContentMasked,
  type AdultContentFlags,
} from '../lib/api/adultVerificationRequired'

/**
 * Why the verification prompt was raised. Selects the modal body copy.
 * - read: opening adult posts or works (search, feed)
 * - topicroom: entering an adult topic room
 * - createTopicRoom: creating a topic room for an adult work
 * - writeReview: writing a review for an adult work
 * - writePost: writing a feed post for an adult work
 */
export type AdultVerificationContext =
  | 'read'
  | 'topicroom'
  | 'createTopicRoom'
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

/**
 * The session's verification status query. Declared here so the axios
 * interceptor can refetch it without importing the hook (which would pull in
 * the api module and close an import cycle).
 */
export const ADULT_VERIFICATION_STATUS_QUERY_KEY = [
  'adult-verification',
  'me',
] as const

/** Server-confirmed verification. False while the status is unknown. */
export const useIsAdultVerified = (): boolean =>
  useAdultVerificationStore((state) => state.status?.state === 'VERIFIED')

/**
 * Whether adult content must be masked for the current user.
 * The rule lives in isAdultContentMasked (server isBlinded first).
 */
export const useShouldMaskAdultContent = (flags: AdultContentFlags): boolean => {
  const verified = useIsAdultVerified()
  return isAdultContentMasked(flags, verified)
}

/** Same rule as useShouldMaskAdultContent, for event handlers. */
export const shouldMaskAdultContent = (flags: AdultContentFlags): boolean =>
  isAdultContentMasked(
    flags,
    useAdultVerificationStore.getState().status?.state === 'VERIFIED',
  )
