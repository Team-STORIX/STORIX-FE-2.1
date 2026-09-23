import { useEffect, useRef } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { useRouter } from 'expo-router'

import { isAdultVerificationRequiredError } from '../api/adultVerificationRequired'
import { useIsAdultVerified } from '../../store/adultVerification.store'
import { shouldLeaveForAdultVerification } from './leaveOnAdultVerification'

/**
 * For screens opened without knowing the content is adult-only (push, deep
 * link, a works arrow): when their data request answers 403
 * ADULT_VERIFICATION_ERROR_008, step back once. The verification prompt is
 * mounted at the root, so it stays up over the previous screen.
 *
 * Returns true while leaving so the caller can hide its error state instead
 * of flashing "failed to load" under the prompt.
 */
export function useLeaveOnAdultVerificationRequired(error: unknown): boolean {
  const router = useRouter()
  const isFocused = useIsFocused()
  const isVerified = useIsAdultVerified()
  const leftRef = useRef(false)
  const required = isAdultVerificationRequiredError(error)

  useEffect(() => {
    const leave = shouldLeaveForAdultVerification({
      hasRequiredError: required,
      isFocused,
      isVerified,
      alreadyLeft: leftRef.current,
    })
    if (!leave) return

    // Set only when this screen actually navigates, so a screen that was
    // unfocused at the time still leaves when the user comes back to it.
    leftRef.current = true
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)' as never)
  }, [required, isFocused, isVerified, router])

  return required
}
