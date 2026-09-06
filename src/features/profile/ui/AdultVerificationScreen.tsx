import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  IdentityVerification,
  type PortOneController,
} from '@portone/react-native-sdk'

import { C, Gray } from '../../../theme'
import {
  ADULT_VERIFICATION_ERROR_CODES,
  confirmAdultVerification,
  getAdultVerificationErrorCode,
  issueAdultVerification,
  syncAdultVerification,
  type AdultVerificationTicket,
} from '../api'

const backIcon = require('../../../../assets/icons/common/back.svg')

type ScreenStage =
  | 'issuing'
  | 'verifying'
  | 'confirming'
  | 'incomplete'
  | 'underage'
  | 'error'

export function AdultVerificationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const controllerRef = useRef<PortOneController>(null)
  const confirmingRef = useRef(false)
  const mountedRef = useRef(true)

  const [ticket, setTicket] = useState<AdultVerificationTicket | null>(null)
  const [stage, setStage] = useState<ScreenStage>('issuing')
  const [attempt, setAttempt] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [canRetry, setCanRetry] = useState(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/profile/settings' as never)
  }, [router])

  const showError = useCallback((error: unknown) => {
    if (!mountedRef.current) return

    const code = getAdultVerificationErrorCode(error)
    if (code === ADULT_VERIFICATION_ERROR_CODES.underage) {
      setStage('underage')
      return
    }

    setErrorMessage(
      error instanceof Error
        ? error.message
        : '잠시 후 다시 인증을 진행해 주세요.',
    )
    setCanRetry(code !== ADULT_VERIFICATION_ERROR_CODES.requesterMismatch)
    setStage('error')
  }, [])

  const issueTicket = useCallback(async () => {
    confirmingRef.current = false
    setTicket(null)
    setStage('issuing')
    setErrorMessage('')

    try {
      const nextTicket = await issueAdultVerification()
      if (!mountedRef.current) return
      setTicket(nextTicket)
      setAttempt((value) => value + 1)
      setStage('verifying')
    } catch (error) {
      const code = getAdultVerificationErrorCode(error)
      if (code === ADULT_VERIFICATION_ERROR_CODES.alreadyVerified) {
        try {
          await syncAdultVerification()
          if (mountedRef.current) goBack()
        } catch (syncError) {
          showError(syncError)
        }
        return
      }
      showError(error)
    }
  }, [goBack, showError])

  useEffect(() => {
    void issueTicket()
  }, [issueTicket])

  const confirmTicket = useCallback(
    async (exitAfterConfirmation: boolean) => {
      if (!ticket || confirmingRef.current) return
      confirmingRef.current = true
      setStage('confirming')

      try {
        const status = await confirmAdultVerification(
          ticket.identityVerificationId,
        )
        if (!mountedRef.current) return

        if (exitAfterConfirmation || status.state === 'VERIFIED') {
          goBack()
          return
        }

        setErrorMessage('본인인증 상태를 확인할 수 없어요. 다시 진행해 주세요.')
        setCanRetry(true)
        setStage('error')
      } catch (error) {
        if (!mountedRef.current) return
        if (exitAfterConfirmation) {
          goBack()
          return
        }

        const code = getAdultVerificationErrorCode(error)
        if (code === ADULT_VERIFICATION_ERROR_CODES.incompleteVerification) {
          setStage('incomplete')
          return
        }
        if (code === ADULT_VERIFICATION_ERROR_CODES.alreadyVerified) {
          try {
            await syncAdultVerification()
            if (mountedRef.current) goBack()
          } catch (syncError) {
            showError(syncError)
          }
          return
        }
        showError(error)
      }
    },
    [goBack, showError, ticket],
  )

  const closeScreen = useCallback(() => {
    if (stage === 'confirming') return
    if (stage === 'verifying' && ticket) {
      void confirmTicket(true)
      return
    }
    goBack()
  }, [confirmTicket, goBack, stage, ticket])

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        closeScreen()
        return true
      },
    )
    return () => subscription.remove()
  }, [closeScreen])

  const retryCurrentTicket = useCallback(() => {
    confirmingRef.current = false
    setAttempt((value) => value + 1)
    setStage('verifying')
  }, [])

  const renderStatus = () => {
    if (stage === 'issuing' || stage === 'confirming') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.statusText}>
            {stage === 'issuing'
              ? '인증창을 준비하고 있어요'
              : '인증 결과를 확인하고 있어요'}
          </Text>
        </View>
      )
    }

    if (stage === 'underage') {
      return (
        <View
          style={[styles.result, { paddingBottom: insets.bottom + 28 }]}
        >
          <View style={styles.resultCopy}>
            <Text style={styles.resultTitle}>성인인증을 완료할 수 없어요</Text>
            <Text style={styles.resultDescription}>
              만 19세 미만은 성인 콘텐츠를 이용할 수 없습니다.
            </Text>
          </View>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonLabel}>설정으로 돌아가기</Text>
          </Pressable>
        </View>
      )
    }

    const incomplete = stage === 'incomplete'
    return (
      <View style={[styles.result, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.resultCopy}>
          <Text style={styles.resultTitle}>
            {incomplete
              ? '인증이 완료되지 않았어요'
              : '본인인증을 진행할 수 없어요'}
          </Text>
          <Text style={styles.resultDescription}>
            {incomplete
              ? '같은 인증 건으로 이어서 진행할 수 있어요.'
              : errorMessage || '잠시 후 다시 인증을 진행해 주세요.'}
          </Text>
        </View>
        <View style={styles.actions}>
          {(incomplete || canRetry) && (
            <Pressable
              onPress={incomplete ? retryCurrentTicket : issueTicket}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonLabel}>
                {incomplete ? '이어서 인증하기' : '다시 시도'}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonLabel}>설정으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ headerShown: false, gestureEnabled: false }}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarInner}>
          <Pressable
            onPress={closeScreen}
            disabled={stage === 'confirming'}
            accessibilityRole="button"
            accessibilityLabel="본인인증 닫기"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
              stage === 'confirming' && styles.disabled,
            ]}
          >
            <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.topBarTitle}>성인 인증</Text>
        </View>
      </View>

      {stage === 'verifying' && ticket ? (
        <IdentityVerification
          key={attempt}
          ref={controllerRef}
          request={ticket}
          onComplete={() => void confirmTicket(false)}
          onError={() => void confirmTicket(false)}
          style={[styles.webView, { marginBottom: insets.bottom }]}
        />
      ) : (
        renderStatus()
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  topBarInner: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  topBarTitle: {
    fontFamily: 'SUITMedium',
    fontSize: 16,
    lineHeight: 22.4,
    color: C.text,
  },
  webView: {
    flex: 1,
    backgroundColor: C.card,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  statusText: {
    fontFamily: 'SUITMedium',
    fontSize: 14,
    lineHeight: 19.6,
    color: Gray[600],
    textAlign: 'center',
  },
  result: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  resultCopy: {
    alignItems: 'center',
    gap: 12,
  },
  resultTitle: {
    fontFamily: 'SUITBold',
    fontSize: 20,
    lineHeight: 28,
    color: C.text,
    textAlign: 'center',
  },
  resultDescription: {
    fontFamily: 'SUITMedium',
    fontSize: 14,
    lineHeight: 19.6,
    color: Gray[500],
    textAlign: 'center',
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    minHeight: 49,
    borderRadius: 8,
    backgroundColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonLabel: {
    fontFamily: 'SUITMedium',
    fontSize: 16,
    lineHeight: 22.4,
    color: C.card,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonLabel: {
    fontFamily: 'SUITMedium',
    fontSize: 16,
    lineHeight: 22.4,
    color: Gray[700],
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
})
