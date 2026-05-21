import { useEffect, useState } from 'react'
import { getItem } from '../../../lib/storage/async'

export type SocialProvider = 'kakao' | 'naver' | 'apple'

const PROVIDER_NAMES: Record<SocialProvider, string> = {
  kakao: '카카오',
  naver: '네이버',
  apple: '애플',
}

export const SOCIAL_PROVIDER_KEY = 'socialProvider'

export const useSocialProvider = () => {
  const [provider, setProvider] = useState<SocialProvider | null>(null)

  useEffect(() => {
    void getItem<SocialProvider>(SOCIAL_PROVIDER_KEY).then(setProvider)
  }, [])

  return provider ? PROVIDER_NAMES[provider] : null
}
