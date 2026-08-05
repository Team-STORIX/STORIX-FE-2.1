import analytics from '@react-native-firebase/analytics'

type SignupProvider = 'kakao' | 'naver' | 'twitter' | 'apple' | 'unknown'

const SIGNUP_PROVIDER_EVENTS: Record<Exclude<SignupProvider, 'unknown'>, string> = {
  kakao: 'sign_up_kakao',
  naver: 'sign_up_naver',
  twitter: 'sign_up_twitter',
  apple: 'sign_up_apple',
}

function normalizeSignupProvider(provider?: string | null): SignupProvider {
  if (provider === 'kakao' || provider === 'naver' || provider === 'apple') {
    return provider
  }

  if (provider === 'x' || provider === 'twitter') {
    return 'twitter'
  }

  return 'unknown'
}

async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  try {
    await analytics().logEvent(name, params)
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] logEvent failed:', {
        name,
        error,
      })
    }
  }
}

export async function trackSignupCompleted(provider?: string | null) {
  const method = normalizeSignupProvider(provider)
  const events = [
    logAnalyticsEvent('sign_up', { method }),
  ]

  if (method !== 'unknown') {
    events.push(logAnalyticsEvent(SIGNUP_PROVIDER_EVENTS[method], { method }))
  }

  await Promise.allSettled(events)
}

export async function trackWithdrawAccount(params?: {
  provider?: string | null
  reasonCount?: number
}) {
  await logAnalyticsEvent('withdraw_account', {
    method: normalizeSignupProvider(params?.provider),
    reason_count: params?.reasonCount ?? 0,
  })
}

