import { useEffect, useState } from 'react'
import { getItem } from '../../../lib/storage/async'

export type SocialProvider = 'kakao' | 'naver' | 'apple' | 'x'

const PROVIDER_NAMES: Record<SocialProvider, string> = {
  kakao: '카카오',
  naver: '네이버',
  apple: '애플',
  x: 'X(트위터)',
}

const isSocialProvider = (value: unknown): value is SocialProvider =>
  value === 'kakao' || value === 'naver' || value === 'apple' || value === 'x'

export const SOCIAL_PROVIDER_KEY = 'socialProvider'

export const useSocialProvider = () => {
  const [provider, setProvider] = useState<SocialProvider | null>(null)

  useEffect(() => {
    void getItem<unknown>(SOCIAL_PROVIDER_KEY).then((value) => {
      setProvider(isSocialProvider(value) ? value : null)
    })
  }, [])

  return provider ? PROVIDER_NAMES[provider] : null
}
