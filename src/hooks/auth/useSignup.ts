// src/hooks/auth/useSignup.ts
//
// Completes signup for a new STORIX user.
//
// Intentionally does NOT navigate after success — the caller is responsible for
// navigating once any follow-up work (e.g. profile image upload) is complete.

import { useMutation } from '@tanstack/react-query'
import { Alert } from 'react-native'
import { AxiosError } from 'axios'

import { signup } from '../../lib/api/auth/signup.api'
import { type SignupRequest } from '../../lib/api/auth/auth.schema'
import { useAuthStore } from '../../store/auth.store'

export const useSignup = () => {
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      const onboardingToken = useAuthStore.getState().onboardingToken
      if (!onboardingToken) throw new Error('Onboarding token is missing')
      return signup(data, onboardingToken)
    },

    onSuccess: async (response) => {
      const { accessToken, refreshToken } = response.result
      // refreshToken may be absent if the signup endpoint has not yet been
      // updated server-side — setLoginTokens handles the optional case.
      await setLoginTokens({ accessToken, refreshToken })
      // Navigation is left to the caller (e.g. navigate after profile image upload).
    },

    onError: async (error: AxiosError) => {
      console.error('[useSignup] failed:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      })
      await clearAuth()
      Alert.alert(
        '회원가입 실패',
        '회원가입에 실패했습니다. 다시 시도해주세요.',
      )
    },
  })
}
