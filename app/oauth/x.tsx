import { useEffect, useRef } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { useXLogin } from '../../src/features/auth/hooks'
import {
  clearPendingXOAuthSession,
  getPendingXOAuthSession,
  X_OAUTH_CONFIG,
} from '../../src/features/auth/lib/xOAuth'
import { C, Typography } from '../../src/theme'

export default function XOAuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string
    state?: string
    error?: string
    error_description?: string
  }>()
  const router = useRouter()
  const xLoginMutation = useXLogin()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const completeLogin = async () => {
      const code = Array.isArray(params.code) ? params.code[0] : params.code
      const state = Array.isArray(params.state) ? params.state[0] : params.state
      const oauthError = Array.isArray(params.error)
        ? params.error[0]
        : params.error
      const oauthErrorDescription = Array.isArray(params.error_description)
        ? params.error_description[0]
        : params.error_description

      console.log('[X OAuth Callback] params:', {
        hasCode: !!code,
        state,
        error: oauthError,
        errorDescription: oauthErrorDescription,
      })

      if (oauthError) {
        await clearPendingXOAuthSession()
        Alert.alert('로그인 실패', 'X 로그인이 취소되었거나 실패했어요.')
        router.replace('/(auth)/login')
        return
      }

      if (!code || !state) {
        await clearPendingXOAuthSession()
        Alert.alert('로그인 실패', 'X 로그인 응답이 올바르지 않아요.')
        router.replace('/(auth)/login')
        return
      }

      const pendingSession = await getPendingXOAuthSession()

      if (!pendingSession) {
        Alert.alert('로그인 실패', 'X 로그인 세션이 만료되었어요. 다시 시도해주세요.')
        router.replace('/(auth)/login')
        return
      }

      if (pendingSession.state !== state) {
        await clearPendingXOAuthSession()
        Alert.alert('로그인 실패', 'X 로그인 검증에 실패했어요. 다시 시도해주세요.')
        router.replace('/(auth)/login')
        return
      }

      await clearPendingXOAuthSession()
      xLoginMutation.mutate({
        code,
        redirectUri: X_OAUTH_CONFIG.redirectUri,
        codeVerifier: pendingSession.codeVerifier,
      })
    }

    void completeLogin()
  }, [params, router, xLoginMutation])

  return (
    <View style={styles.screen}>
      <ActivityIndicator size="small" color={C.primary} />
      <Text style={styles.text}>X 로그인 처리 중입니다.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: C.card,
  },
  text: {
    ...Typography.body2Medium,
    color: C.text,
  },
})
