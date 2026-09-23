// Pure decision behind useLeaveOnAdultVerificationRequired, kept free of
// react/expo-router imports so it can be unit tested.

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
