// src/hooks/auth/useSignup.ts
//
// Completes signup for a new STORIX user.
//
// Intentionally does NOT navigate after success. The caller is responsible for
// navigating once any follow-up work is complete.

import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { signup } from '../api/signup.api'
import { type SignupRequest } from '../api/auth.schema'
import { useAuthStore } from '../../../store/auth.store'

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
      // updated server-side. setLoginTokens handles the optional case.
      await setLoginTokens({ accessToken, refreshToken })
      // Navigation is left to the caller.
    },

    onError: (error) => {
      if (isAxiosError(error)) {
        const code =
          typeof error.response?.data === 'object' && error.response?.data
            ? (error.response.data as { code?: unknown }).code
            : undefined

        console.log('[useSignup] failed:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        })

        if (code === 'TOKEN_ERROR_001' || code === 'TOKEN_ERROR_002') {
          void clearAuth()
        }
        return
      }

      console.log('[useSignup] failed:', error)
    },
  })
}
