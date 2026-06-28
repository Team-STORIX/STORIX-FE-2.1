import { create } from 'zustand'
import {
  getAccessToken,
  setAccessToken as persistAccessToken,
  setRefreshToken as persistRefreshToken,
  getOnboardingToken,
  setOnboardingToken as persistOnboardingToken,
  removeOnboardingToken,
  removeAccessToken,
  removeRefreshToken,
  clearAuthTokens,
} from '../lib/storage/secure'
import { getItem, setItem, removeItem } from '../lib/storage/async'
import { queryClient } from '../lib/query/queryClient'
import { useProfileStore } from '../features/profile/store/profile.store'
import { useLikesStore } from './likes.store'
import { useFavoritesStore } from './favorites.store'
import { resetToLogin } from '../lib/navigation/navigationRef'

// AsyncStorage keys for non-sensitive consent flags.
const SERVICE_TERMS_AGREE_KEY = 'serviceTermsAgree'
const PRIVACY_POLICY_AGREE_KEY = 'privacyPolicyAgree'
const AGE_OVER_14_KEY = 'ageOver14'
const MARKETING_AGREE_KEY = 'marketingAgree'

// ---------- types ----------

type AuthState = {
  // In-memory mirrors of SecureStore values.
  // Source of truth is always SecureStore; these are seeded by hydrateAuth().
  accessToken: string | null
  onboardingToken: string | null

  // Derived state.
  isAuthenticated: boolean

  // UI / UX.
  isLoading: boolean
  serviceTermsAgree: boolean
  privacyPolicyAgree: boolean
  ageOver14: boolean
  marketingAgree: boolean
}

type AuthActions = {
  /**
   * Call once at app startup (app/_layout.tsx).
   * Reads tokens from SecureStore and seeds in-memory state.
   * Does not call any API.
   */
  hydrateAuth: () => Promise<void>

  /**
   * Called after a successful login or signup.
   * Writes accessToken (and optionally refreshToken) to SecureStore, mirrors
   * accessToken in memory, clears any onboarding token, and marks isAuthenticated = true.
   *
   * refreshToken is optional because the signup endpoint may not return it until
   * the backend is updated. When absent, the user will need to re-login after
   * the access token expires.
   */
  setLoginTokens: (tokens: {
    accessToken: string
    refreshToken?: string
  }) => Promise<void>

  /**
   * Called after a social login where the user is new (pre-signup).
   * Stores the short-lived onboarding token; access token stays null.
   */
  setOnboardingToken: (token: string) => Promise<void>

  /** Persists the service terms agreement flag to AsyncStorage. */
  setServiceTermsAgree: (agree: boolean) => Promise<void>

  /** Persists the privacy policy agreement flag to AsyncStorage. */
  setPrivacyPolicyAgree: (agree: boolean) => Promise<void>

  /** Persists the age over 14 agreement flag to AsyncStorage. */
  setAgeOver14: (agree: boolean) => Promise<void>

  /** Persists the marketing consent flag to AsyncStorage. */
  setMarketingAgree: (agree: boolean) => Promise<void>

  /**
   * Convenience method to set all three mandatory consent fields at once.
   * Used by the agreement screen after user accepts all required terms.
   */
  setMandatoryConsents: (consents: {
    serviceTermsAgree: boolean
    privacyPolicyAgree: boolean
    ageOver14: boolean
  }) => Promise<void>

  /**
   * Full sign-out.
   * Wipes SecureStore, resets in-memory state, and clears the profile cache.
   *
   * TODO(Phase navigation): Reset the navigation stack to the login screen here.
   *   Example once navigationRef is wired:
   *     navigationRef.current?.reset({ index: 0, routes: [{ name: '(auth)/login' }] })
   */
  clearAuth: () => Promise<void>

  /** Toggle a loading spinner (e.g. during splash hydration). */
  setLoading: (loading: boolean) => void
}

// ---------- store ----------

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  onboardingToken: null,
  isAuthenticated: false,
  isLoading: false,
  serviceTermsAgree: false,
  privacyPolicyAgree: false,
  ageOver14: false,
  marketingAgree: false,

  hydrateAuth: async () => {
    // Run SecureStore reads in parallel to minimise splash delay.
    const [accessToken, onboardingToken, serviceTermsAgree, privacyPolicyAgree, ageOver14, marketingAgree] = await Promise.all([
      getAccessToken(),
      getOnboardingToken(),
      getItem<boolean>(SERVICE_TERMS_AGREE_KEY),
      getItem<boolean>(PRIVACY_POLICY_AGREE_KEY),
      getItem<boolean>(AGE_OVER_14_KEY),
      getItem<boolean>(MARKETING_AGREE_KEY),
    ])

    set({
      accessToken,
      onboardingToken,
      isAuthenticated: !!accessToken,
      serviceTermsAgree: serviceTermsAgree ?? false,
      privacyPolicyAgree: privacyPolicyAgree ?? false,
      ageOver14: ageOver14 ?? false,
      marketingAgree: marketingAgree ?? false,
    })
  },

  setLoginTokens: async ({ accessToken, refreshToken }) => {
    // Write tokens to SecureStore first so the axios interceptor can read them
    // immediately if a request fires before the next render cycle.
    const ops: Promise<void>[] = [
      persistAccessToken(accessToken),
      removeOnboardingToken(),
    ]
    if (refreshToken) {
      ops.push(persistRefreshToken(refreshToken))
    } else {
      ops.push(removeRefreshToken())
    }
    await Promise.all(ops)

    set({
      accessToken,
      onboardingToken: null,
      isAuthenticated: true,
    })
  },

  setOnboardingToken: async (token) => {
    await Promise.all([
      persistOnboardingToken(token),
      removeAccessToken(),
      removeRefreshToken(),
    ])

    set({
      onboardingToken: token,
      accessToken: null,
      isAuthenticated: false,
    })
  },

  setServiceTermsAgree: async (agree) => {
    await setItem(SERVICE_TERMS_AGREE_KEY, agree)
    set({ serviceTermsAgree: agree })
  },

  setPrivacyPolicyAgree: async (agree) => {
    await setItem(PRIVACY_POLICY_AGREE_KEY, agree)
    set({ privacyPolicyAgree: agree })
  },

  setAgeOver14: async (agree) => {
    await setItem(AGE_OVER_14_KEY, agree)
    set({ ageOver14: agree })
  },

  setMarketingAgree: async (agree) => {
    await setItem(MARKETING_AGREE_KEY, agree)
    set({ marketingAgree: agree })
  },

  setMandatoryConsents: async ({ serviceTermsAgree, privacyPolicyAgree, ageOver14 }) => {
    await Promise.all([
      setItem(SERVICE_TERMS_AGREE_KEY, serviceTermsAgree),
      setItem(PRIVACY_POLICY_AGREE_KEY, privacyPolicyAgree),
      setItem(AGE_OVER_14_KEY, ageOver14),
    ])
    set({ serviceTermsAgree, privacyPolicyAgree, ageOver14 })
  },

  clearAuth: async () => {
    await clearAuthTokens()

    // Clear all per-user caches so stale data is not shown after re-login.
    await Promise.all([
      removeItem(SERVICE_TERMS_AGREE_KEY),
      removeItem(PRIVACY_POLICY_AGREE_KEY),
      removeItem(AGE_OVER_14_KEY),
      removeItem(MARKETING_AGREE_KEY),
      removeItem('tempSocialProvider'),
      removeItem('socialProvider'),
      useLikesStore.getState().clearLikes(),
      useFavoritesStore.getState().clearFavorites(),
    ])
    useProfileStore.getState().clearMe()
    queryClient.clear()

    set({
      accessToken: null,
      onboardingToken: null,
      isAuthenticated: false,
      serviceTermsAgree: false,
      privacyPolicyAgree: false,
      ageOver14: false,
      marketingAgree: false,
    })

    // Navigate to login after state is reset.
    resetToLogin()
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
