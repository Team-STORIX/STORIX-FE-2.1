import { useCallback, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'

import {
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
      const nextStatus = await syncAdultVerification()
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
