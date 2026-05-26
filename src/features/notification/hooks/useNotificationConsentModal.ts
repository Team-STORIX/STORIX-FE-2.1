import { useEffect, useRef, useState } from 'react'

import { useProfileStore } from '../../profile/store/profile.store'
import { useAuthStore } from '../../../store/auth.store'
import type { MarketingConsentResult } from '../api/notification.schema'
import { reconcilePushDevice } from '../services/pushDeviceSync'
import {
  isNotificationConsentCompleted,
  markNotificationConsentCompleted,
} from '../services/notificationConsentStorage'
import { useUpdateMarketingConsent } from './useNotificationMutations'

export type ConsentStep = 'hidden' | 'initial' | 'agreeResult' | 'rejectResult'

export type NotificationConsentModalState = {
  step: ConsentStep
  submitting: boolean
  /** Server-returned consent receipt; null when the API call failed and the
   * result modal falls back to static copy. */
  result: MarketingConsentResult | null
  onAgree: () => void
  onReject: () => void
  onConfirm: () => void
}

/**
 * Drives the one-time event/benefit (marketing) consent modal shown on the
 * first Home entry after onboarding.
 *
 * Gating (all must hold before the initial modal shows):
 *  - user is authenticated
 *  - no onboardingToken (i.e. onboarding finished, not mid-agreement)
 *  - the consent-completed flag is not set for this user/installation
 *
 * OS push permission + FCM/device sync are owned by usePushNotificationBootstrap
 * (PUSH-DEVICE-API-1); this hook does not duplicate them. It only records the
 * marketing-consent decision via the existing updateMarketingConsent API.
 */
export const useNotificationConsentModal = (): NotificationConsentModalState => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const setMarketingAgree = useAuthStore((s) => s.setMarketingAgree)
  const userId = useProfileStore((s) => s.me?.userId ?? null)

  const { mutateAsync: updateConsent } = useUpdateMarketingConsent()

  const [step, setStep] = useState<ConsentStep>('hidden')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<MarketingConsentResult | null>(null)

  // Tracks which (user|install) scope we have already evaluated, so a userId
  // arriving after auth re-checks under the correct key without re-prompting
  // once the modal is already open or answered.
  const evaluatedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    // Not eligible (logged out / mid-onboarding): hide and allow a future
    // login to re-evaluate.
    if (!isAuthenticated || onboardingToken) {
      evaluatedKeyRef.current = null
      if (step !== 'hidden') setStep('hidden')
      return
    }

    // Already showing or answered this session — leave it alone.
    if (step !== 'hidden') return

    // Wait for a resolved userId before deciding. The profile (useMe) loads
    // momentarily after signup/login; gating on userId keeps the completed
    // flag strictly per-user and avoids a stale installation-level flag from a
    // previous signup blocking a freshly created account on the same install.
    if (userId == null) return

    const scopeKey = `u:${userId}`
    if (evaluatedKeyRef.current === scopeKey) return
    evaluatedKeyRef.current = scopeKey

    let cancelled = false
    void (async () => {
      const completed = await isNotificationConsentCompleted(userId)
      if (!cancelled && !completed) setStep('initial')
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, onboardingToken, userId, step])

  const submit = async (enabled: boolean): Promise<void> => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await updateConsent(enabled)
      setResult(res)
      // Mirror the choice into the local marketing flag for consistency with
      // the rest of the app (onboarding agreement, settings).
      await setMarketingAgree(enabled)

      // Product: the agree button is "동의 후 알림 받기" — agreeing also opts
      // into OS push. reconcilePushDevice() (PUSH-DEVICE-API-1) requests the OS
      // permission and, if granted, performs the FCM/device sync. Reused here
      // rather than duplicated; best-effort and never blocks the result modal.
      if (enabled) {
        try {
          await reconcilePushDevice()
        } catch (pushErr) {
          if (__DEV__) {
            const detail =
              pushErr instanceof Error ? pushErr.message : String(pushErr)
            // eslint-disable-next-line no-console
            console.warn('[notification-consent] push reconcile failed', detail)
          }
        }
      }
    } catch (err) {
      if (__DEV__) {
        const detail = err instanceof Error ? err.message : String(err)
        // eslint-disable-next-line no-console
        console.warn('[notification-consent] update failed', detail)
      }
      setResult(null) // Result modal falls back to static copy.
    } finally {
      // Record completion regardless of API outcome so the user is asked only
      // once; the choice can still be changed later in notification settings.
      await markNotificationConsentCompleted(userId)
      setSubmitting(false)
      setStep(enabled ? 'agreeResult' : 'rejectResult')
    }
  }

  return {
    step,
    submitting,
    result,
    onAgree: () => void submit(true),
    onReject: () => void submit(false),
    onConfirm: () => setStep('hidden'),
  }
}
