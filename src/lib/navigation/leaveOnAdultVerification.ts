// Pure decisions behind useLeaveOnAdultVerificationRequired, kept free of
// react/expo-router imports so they can be unit tested.

type LeaveDecisionInput = {
  /** The screen's query failed with 403 ADULT_VERIFICATION_ERROR_008. */
  hasRequiredError: boolean
  /** The screen is the one the user is looking at. */
  isFocused: boolean
  /** The user has since completed verification; the data will refetch. */
  isVerified: boolean
  /** This screen already navigated away once. */
  alreadyLeft: boolean
}

/**
 * Only the focused screen may navigate. A screen left mounted underneath
 * (a topic room the user opened the verification screen from) would otherwise
 * pop whatever the user opened on top of it once its retry finally failed.
 */
export const shouldLeaveForAdultVerification = ({
  hasRequiredError,
  isFocused,
  isVerified,
  alreadyLeft,
}: LeaveDecisionInput): boolean =>
  hasRequiredError && isFocused && !isVerified && !alreadyLeft

type ErrorStateInput = {
  hasRequiredError: boolean
  /** This render decided to navigate away. */
  isLeaving: boolean
  /** The screen navigated away on an earlier render. */
  alreadyLeft: boolean
  /** The status query raised by the 403 has not answered yet. */
  isCheckingStatus: boolean
}

/**
 * Whether the screen should hide its error state and keep the spinner.
 * Only while something is actually resolving: the screen is leaving, or the
 * status refetch that decides whether to leave is still running. A stored
 * VERIFIED state that has silently expired would otherwise hold the screen on
 * a spinner forever, since it blocks the leave but the 403 never clears.
 */
export const shouldHideErrorForAdultVerification = ({
  hasRequiredError,
  isLeaving,
  alreadyLeft,
  isCheckingStatus,
}: ErrorStateInput): boolean =>
  hasRequiredError && (isLeaving || alreadyLeft || isCheckingStatus)
