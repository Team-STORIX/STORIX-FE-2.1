// Kept free of feature imports so axios-instance can use it without creating a
// circular dependency (adultVerification.api.ts imports apiClient).

/** 403 returned by content endpoints when the user has not completed adult verification. */
export const ADULT_VERIFICATION_REQUIRED_CODE = 'ADULT_VERIFICATION_ERROR_008'

export const isAdultVerificationRequiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false

  const response = (
    error as { response?: { status?: unknown; data?: { code?: unknown } } }
  ).response

  return (
    response?.status === 403 &&
    response.data?.code === ADULT_VERIFICATION_REQUIRED_CODE
  )
}
