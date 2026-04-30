// src/hooks/auth/useNativeSocialLogin.ts
//
// iOS/Android native social login flow:
//   SDK → accessToken (+ optional idToken) → BE native endpoint → store tokens.
//
// The nativeSocialAuthProvider throws with a clear TODO message until the real
// RN SDKs (@react-native-kakao, @react-native-seoul/naver-login) are installed.
// See src/lib/auth/social/native.ts for setup instructions.

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { AxiosError } from 'axios'

import { kakaoNativeLogin } from '../../lib/api/auth/kakao.api'
import { naverNativeLogin } from '../../lib/api/auth/naver.api'
import {
  extractLoginTokens,
  type SocialLoginResponse,
} from '../../lib/api/auth/auth.schema'
import {
  nativeSocialAuthProvider,
  type SocialProviderId,
} from '../../lib/auth/social'
import { useAuthStore } from '../../store/auth.store'

// ─── internal helper ──────────────────────────────────────────────────────────

const callBackend = async (
  provider: SocialProviderId,
): Promise<SocialLoginResponse> => {
  if (provider === 'kakao') {
    // idToken is optional — only present when OpenID Connect is enabled in
    // the Kakao developer console.
    const { accessToken, idToken } =
      await nativeSocialAuthProvider.loginWithKakao()
    return kakaoNativeLogin({ accessToken, idToken })
  }
  const { accessToken } = await nativeSocialAuthProvider.loginWithNaver()
  return naverNativeLogin({ accessToken })
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export const useNativeSocialLogin = () => {
  const router = useRouter()
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens)
  const setOnboardingToken = useAuthStore((s) => s.setOnboardingToken)

  return useMutation({
    mutationFn: (provider: SocialProviderId) => callBackend(provider),

    onSuccess: async (data: SocialLoginResponse) => {
      const { isRegistered, readerPreLoginResponse } = data.result
      const loginTokens = extractLoginTokens(data.result)

      // Existing user — store tokens and go to the main app.
      if (isRegistered && loginTokens) {
        await setLoginTokens(loginTokens)
        router.replace('/(tabs)')
        return
      }

      // New user — store the onboarding token and start the signup flow.
      if (!isRegistered && readerPreLoginResponse?.onboardingToken) {
        await setOnboardingToken(readerPreLoginResponse.onboardingToken)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/(auth)/agreement' as any)
        return
      }

      // Neither branch matched — log for debugging.
      console.error('[useNativeSocialLogin] unexpected response shape:', data)
    },

    onError: (error: AxiosError) => {
      // Do NOT use Alert.alert here — on iOS, calling alert() immediately after
      // a WKWebView / SafariViewController dismissal can cause a crash.
      // The calling screen should observe mutation.isError and render its own UI.
      console.error('[useNativeSocialLogin] failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })
    },
  })
}
