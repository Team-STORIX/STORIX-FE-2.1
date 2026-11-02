import { useCallback, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'

import {
  ADULT_VERIFICATION_ERROR_CODES,
  getAdultVerificationErrorCode,
  getAdultVerificationStatus,
  syncAdultVerification,
  type AdultVerificationStatus,
} from '../api'

export function useAdultVerificationStatus() {
  const [status, setStatus] = useState<AdultVerificationStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      let nextStatus: AdultVerificationStatus

      try {
        nextStatus = await syncAdultVerification()
      } catch (syncError) {
        const code = getAdultVerificationErrorCode(syncError)
        const canRecoverFromStoredStatus =
          code === ADULT_VERIFICATION_ERROR_CODES.incompleteVerification ||
          code === ADULT_VERIFICATION_ERROR_CODES.expiredVerification

        if (!canRecoverFromStoredStatus) throw syncError
        nextStatus = await getAdultVerificationStatus()
      }

      if (requestId === requestIdRef.current) setStatus(nextStatus)
      return nextStatus
    } catch (nextError) {
      const normalizedError =
        nextError instanceof Error
          ? nextError
          : new Error('성인인증 상태를 확인할 수 없어요.')
      if (requestId === requestIdRef.current) setError(normalizedError)
      throw normalizedError
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => undefined)

      return () => {
        requestIdRef.current += 1
      }
    }, [refresh]),
  )

  return { status, error, isLoading, refresh }
}
