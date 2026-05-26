// src/hooks/auth/useKakaoLogin.ts
//
// Kakao web/redirect login — exchanges an authorisation code for tokens.
// Used when the OAuth code is delivered via expo-web-browser or a deep link,
// rather than through the native Kakao SDK.
// For native SDK flow use useNativeSocialLogin({ provider: 'kakao' }) instead.

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { AxiosError } from 'axios'

import { kakaoLogin } from '../api/kakao.api'
import {
  extractLoginTokens,
  type KakaoLoginResponse,
} from '../api/auth.schema'
import { useAuthStore } from '../../../store/auth.store'
import { setItem } from '../../../lib/storage/async'
import { SOCIAL_PROVIDER_KEY } from '../../profile/hooks/useSocialProvider'

export const useKakaoLogin = () => {
  const router = useRouter()
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens)
  const setOnboardingToken = useAuthStore((s) => s.setOnboardingToken)

  return useMutation({
    mutationFn: (code: string) => kakaoLogin(code),

    onSuccess: async (data: KakaoLoginResponse) => {
      const { isRegistered, readerPreLoginResponse } = data.result
      const loginTokens = extractLoginTokens(data.result)

      // Existing user — store tokens and go to the main app.
      if (isRegistered && loginTokens) {
        await Promise.all([
          setLoginTokens(loginTokens),
          setItem(SOCIAL_PROVIDER_KEY, 'kakao'),
        ])
        router.replace('/(tabs)')
        return
      }

      // New user — store the onboarding token and start the signup flow.
      if (!isRegistered && readerPreLoginResponse?.onboardingToken) {
        await setOnboardingToken(readerPreLoginResponse.onboardingToken)
        router.replace('/(auth)/agreement')
        return
      }

      Alert.alert(
        '로그인 오류',
        '로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
      )
    },

    onError: (_error: AxiosError) => {
      Alert.alert('로그인 실패', '로그인에 실패했습니다. 다시 시도해주세요.')
      // Return the user to the login screen so they can retry. The login route
      // exists at app/(auth)/login.tsx and is registered in the typed-routes union.
      router.replace('/(auth)/login')
    },
  })
}
