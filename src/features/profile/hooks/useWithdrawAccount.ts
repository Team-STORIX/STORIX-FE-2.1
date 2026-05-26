import { useState } from 'react'
import { withdrawUser } from '../../auth'
import { useAuthStore } from '../../../store/auth.store'

export function useWithdrawAccount() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isPending, setIsPending] = useState(false)

  const withdraw = async (reasons: string[], detail?: string) => {
    if (isPending) return

    setIsPending(true)

    try {
      await withdrawUser(reasons, detail)
      await clearAuth()
    } catch (error) {
      setIsPending(false)
      throw error
    }
  }

  return {
    isPending,
    withdraw,
  }
}
