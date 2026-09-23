import { useEffect, useState } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { useIsFetching } from '@tanstack/react-query'
import { useRouter } from 'expo-router'

import { isAdultVerificationRequiredError } from '../api/adultVerificationRequired'
import {
  ADULT_VERIFICATION_STATUS_QUERY_KEY,
  useIsAdultVerified,
} from '../../store/adultVerification.store'
import {
  shouldHideErrorForAdultVerification,
  shouldLeaveForAdultVerification,
} from './leaveOnAdultVerification'

/**
 * For screens opened without knowing the content is adult-only (push, deep
 * link, a works arrow): when their data request answers 403
 * ADULT_VERIFICATION_ERROR_008, step back once. The verification prompt is
 * mounted at the root, so it stays up over the previous screen.
 *
 * Returns true while the screen is leaving or while the status refetch that
 * the 403 triggered is still running, so the caller can hide its error state
 * instead of flashing "failed to load" under the prompt.
 */
export function useLeaveOnAdultVerificationRequired(error: unknown): boolean {
  const router = useRouter()
  const isFocused = useIsFocused()
  const isVerified = useIsAdultVerified()
  const isCheckingStatus =
    useIsFetching({ queryKey: ADULT_VERIFICATION_STATUS_QUERY_KEY }) > 0
  const [hasLeft, setHasLeft] = useState(false)
  const required = isAdultVerificationRequiredError(error)

  const isLeaving = shouldLeaveForAdultVerification({
    hasRequiredError: required,
    isFocused,
    isVerified,
    alreadyLeft: hasLeft,
  })

  useEffect(() => {
    if (!isLeaving) return

    // Marked only when this screen actually navigates, so a screen that was
    // unfocused at the time still leaves when the user comes back to it.
    setHasLeft(true)
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)' as never)
  }, [isLeaving, router])

  return shouldHideErrorForAdultVerification({
    hasRequiredError: required,
    isLeaving,
    alreadyLeft: hasLeft,
    isCheckingStatus,
  })
}
