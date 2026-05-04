import { useState } from 'react'
import { logoutUser } from '../../auth'
import { useAuthStore } from '../../../store/auth.store'

export function useLogoutAction() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isPending, setIsPending] = useState(false)

  const logout = async () => {
    if (isPending) return

    setIsPending(true)

    try {
      await logoutUser()
    } catch {
      // Best-effort only. Local logout must still happen.
    }

    try {
      await clearAuth()
    } catch (error) {
      setIsPending(false)
      throw error
    }
  }

  return {
    isPending,
    logout,
  }
}
