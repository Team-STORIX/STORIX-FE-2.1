import { useState } from 'react'
import { withdrawUser } from '../../auth'
import { useAuthStore } from '../../../store/auth.store'
import { getItem } from '../../../lib/storage/async'
import { trackWithdrawAccount } from '../../../lib/analytics/events'
import { deleteCurrentPushDevice } from '../../notification/services'
import { SOCIAL_PROVIDER_KEY } from './useSocialProvider'

export function useWithdrawAccount() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isPending, setIsPending] = useState(false)

  const withdraw = async (reasons: string[], detail?: string) => {
    if (isPending) return

    setIsPending(true)

    try {
      const provider = await getItem<string>(SOCIAL_PROVIDER_KEY)
      await deleteCurrentPushDevice()
      await withdrawUser(reasons, detail)
      await trackWithdrawAccount({
        provider,
        reasonCount: reasons.length,
      })
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
