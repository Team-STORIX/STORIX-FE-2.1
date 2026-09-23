import { useRouter } from 'expo-router'

import { AdultVerificationModal } from '../../../components/adult'
import { useAdultVerificationStore } from '../../../store/adultVerification.store'

// Mounted once at the root so every screen shares it. Raised by the axios
// interceptor on 403 ADULT_VERIFICATION_ERROR_008 and by masked cards that
// the user taps.
export function AdultVerificationRequiredModal() {
  const router = useRouter()
  const visible = useAdultVerificationStore((state) => state.promptVisible)
  const context = useAdultVerificationStore((state) => state.promptContext)
  const hidePrompt = useAdultVerificationStore((state) => state.hidePrompt)

  const startVerification = () => {
    hidePrompt()
    router.push('/profile/adult-verification' as never)
  }

  return (
    <AdultVerificationModal
      visible={visible}
      context={context}
      onConfirm={startVerification}
      onClose={hidePrompt}
    />
  )
}
