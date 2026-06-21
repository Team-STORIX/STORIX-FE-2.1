// src/features/auth/hooks/useXLogin.ts
//
// X (Twitter) OAuth 2.0 PKCE login
// Exchanges an authorization code + code_verifier for tokens.

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { AxiosError } from 'axios'

import { xLogin } from '../api/x.api'
import {
  extractLoginTokens,
  type SocialLoginResponse,
} from '../api/auth.schema'
import { useAuthStore } from '../../../store/auth.store'
import { setItem } from '../../../lib/storage/async'
import { SOCIAL_PROVIDER_KEY } from '../../profile/hooks/useSocialProvider'

export const useXLogin = () => {
  const router = useRouter()
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens)
  const setOnboardingToken = useAuthStore((s) => s.setOnboardingToken)

  return useMutation({
    mutationFn: (args: {
      code: string
      redirectUri: string
      codeVerifier: string
    }) => xLogin(args),

    onSuccess: async (data: SocialLoginResponse) => {
      console.log('[useXLogin] success:', {
        isRegistered: data.result.isRegistered,
        hasRegularLoginResponse: !!data.result.regularLoginResponse,
        hasReaderLoginResponse: !!data.result.readerLoginResponse,
        hasPreLoginResponse: !!data.result.readerPreLoginResponse,
      })

      const { isRegistered, readerPreLoginResponse } = data.result
      const loginTokens = extractLoginTokens(data.result)

      if (isRegistered && loginTokens) {
        await Promise.all([
          setLoginTokens(loginTokens),
          setItem(SOCIAL_PROVIDER_KEY, 'x'),
        ])
        router.replace('/(tabs)')
        return
      }

      if (!isRegistered && readerPreLoginResponse?.onboardingToken) {
        await setOnboardingToken(readerPreLoginResponse.onboardingToken)
        console.log('[useXLogin] onboarding token stored, navigating to agreement')
        router.replace('/agreement' as never)
        return
      }

      Alert.alert(
        '로그인 오류',
        '로그인 처리 중 오류가 발생했어요. 다시 시도해주세요.',
      )
    },

    onError: (error: AxiosError) => {
      console.error('[useXLogin] failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })
      Alert.alert('로그인 실패', '로그인에 실패했어요. 다시 시도해주세요.')
      router.replace('/(auth)/login')
    },
  })
}
