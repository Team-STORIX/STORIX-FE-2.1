// src/features/auth/lib/xOAuth.ts
//
// X (Twitter) OAuth 2.0 PKCE flow utilities

import * as WebBrowser from 'expo-web-browser'
import * as Crypto from 'expo-crypto'
import { Platform } from 'react-native'
import { getItem, removeItem, setItem } from '../../../lib/storage/async'

/**
 * X OAuth 2.0 configuration
 */
export const X_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://x.com/i/oauth2/authorize',
  clientId:
    process.env.EXPO_PUBLIC_X_CLIENT_ID ??
    'ZzFZMEV3X19ydnBnR09IZ2FNNkg6MTpjaQ',
  redirectUri: process.env.EXPO_PUBLIC_X_REDIRECT_URI ?? 'storixfe21://oauth/x',
  scopes: ['tweet.read', 'users.read', 'offline.access'],
} as const

const X_OAUTH_SESSION_KEY = 'auth.x.oauthSession'

export type PendingXOAuthSession = {
  codeVerifier: string
  state: string
}

/**
 * PKCE (Proof Key for Code Exchange) utilities
 * Uses S256 (SHA-256) challenge method
 */

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

const buildQueryString = (params: Record<string, string>): string =>
  Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&')

const getAndroidBrowserPackage = async (): Promise<string | undefined> => {
  if (Platform.OS !== 'android') return undefined

  try {
    const browsers = await WebBrowser.getCustomTabsSupportingBrowsersAsync()
    console.log('[X OAuth] Custom Tabs browsers:', browsers)

    // Samsung Internet can get stuck in an x.com self-redirect loop for OAuth.
    // Chrome is installed on our Android test device and handles this flow more reliably.
    if (
      browsers.browserPackages.includes('com.android.chrome') ||
      browsers.servicePackages.includes('com.android.chrome')
    ) {
      return 'com.android.chrome'
    }

    return browsers.preferredBrowserPackage ?? browsers.defaultBrowserPackage
  } catch (error) {
    console.warn('[X OAuth] Failed to resolve Custom Tabs browser:', error)
    return 'com.android.chrome'
  }
}

export const storePendingXOAuthSession = async (
  session: PendingXOAuthSession,
): Promise<void> => {
  await setItem(X_OAUTH_SESSION_KEY, session)
}

export const getPendingXOAuthSession =
  async (): Promise<PendingXOAuthSession | null> => {
    return getItem<PendingXOAuthSession>(X_OAUTH_SESSION_KEY)
  }

export const clearPendingXOAuthSession = async (): Promise<void> => {
  await removeItem(X_OAUTH_SESSION_KEY)
}

/**
 * Generates a cryptographically random code verifier
 * Length: 43-128 characters (base64url-encoded random bytes)
 */
export const generateCodeVerifier = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32)
  return toBase64Url(randomBytes)
}

/**
 * Generates a code challenge from the code verifier
 * Method: S256 (SHA-256)
 */
export const generateCodeChallenge = async (
  codeVerifier: string,
): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  )
  // Convert to base64url
  return digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Builds the authorization URL for X OAuth 2.0 PKCE flow
 */
export const buildAuthorizationUrl = async (): Promise<{
  url: string
  codeVerifier: string
  state: string
}> => {
  const codeVerifier = await generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = toBase64Url(await Crypto.getRandomBytesAsync(16))
  await storePendingXOAuthSession({ codeVerifier, state })

  const params = buildQueryString({
    response_type: 'code',
    client_id: X_OAUTH_CONFIG.clientId,
    redirect_uri: X_OAUTH_CONFIG.redirectUri,
    scope: X_OAUTH_CONFIG.scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })

  return {
    url: `${X_OAUTH_CONFIG.authorizationEndpoint}?${params}`,
    codeVerifier,
    state,
  }
}

/**
 * Opens X authorization page in an in-app browser
 * Returns the authorization code if successful
 */
export const openXAuthorizationPage = async (): Promise<{
  code: string
  codeVerifier: string
} | null> => {
  try {
    const { url, codeVerifier, state } = await buildAuthorizationUrl()
    const browserPackage = await getAndroidBrowserPackage()

    console.log('[X OAuth] Authorization URL:', url)
    console.log('[X OAuth] Code verifier length:', codeVerifier.length)
    console.log('[X OAuth] Browser package:', browserPackage ?? 'default')

    const result = await WebBrowser.openAuthSessionAsync(
      url,
      X_OAUTH_CONFIG.redirectUri,
      {
        preferEphemeralSession: true,
        showTitle: true,
        ...(browserPackage ? { browserPackage } : null),
      },
    )

    console.log('[X OAuth] WebBrowser result:', result)

    if (result.type !== 'success') {
      console.log('[X OAuth] User cancelled or error:', result.type)
      return null
    }

    // Parse the redirect URL to extract the code
    const redirectUrl = new URL(result.url)
    const code = redirectUrl.searchParams.get('code')
    const returnedState = redirectUrl.searchParams.get('state')
    const oauthError = redirectUrl.searchParams.get('error')
    const oauthErrorDescription = redirectUrl.searchParams.get('error_description')

    if (oauthError) {
      console.error('[X OAuth] Authorization error:', {
        error: oauthError,
        description: oauthErrorDescription,
      })
      return null
    }

    if (returnedState !== state) {
      console.error('[X OAuth] State mismatch')
      return null
    }

    if (!code) {
      console.error('[X OAuth] No code in redirect URL')
      return null
    }

    await clearPendingXOAuthSession()
    return { code, codeVerifier }
  } catch (error) {
    console.error('[X OAuth error]:', error)
    return null
  }
}
