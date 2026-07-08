import { useCallback, useState } from 'react'
import { Alert, Linking, Platform } from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import {
  createProfileCardShare,
  postProfileCardImagePresignedUrl,
  uploadProfileCardImage,
} from '../api/profile-card-share.api'

export type CaptureFunction = () => Promise<string | null>

const SHARE_MESSAGE = 'STORIX 프로필 카드'
const STORIX_SHARE_URL = 'https://www.storix.kr/'
const TWITTER_ANDROID_PACKAGE = 'com.twitter.android'
const TWITTER_IOS_SCHEME = 'twitter://'
const TWITTER_IOS_POST_URL = 'twitter://post'
const TWITTER_WEB_INTENT_URL = 'https://twitter.com/intent/tweet'
const TWITTER_HOME_URL = 'https://twitter.com'

type NativeShareModule = typeof import('react-native-share')

export function useCardShare() {
  const [isSaving, setIsSaving] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const saveToGallery = useCallback(async (
    captureImage: CaptureFunction,
    onSuccess?: () => void,
    message: string = 'STORIX 프로필 카드',
  ) => {
    try {
      setIsSaving(true)

      const { status } = await MediaLibrary.requestPermissionsAsync(true)
      if (status !== 'granted') {
        Alert.alert(
          '\uAD8C\uD55C \uD544\uC694',
          '\uAC24\uB7EC\uB9AC\uC5D0 \uC800\uC7A5\uD558\uB824\uBA74 \uC0AC\uC9C4 \uC800\uC7A5 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.',
        )
        return
      }

      const uri = await captureImage()
      if (!uri) {
        Alert.alert('\uC624\uB958', '\uC774\uBBF8\uC9C0\uB97C \uC0DD\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.')
        return
      }

      await MediaLibrary.saveToLibraryAsync(uri)

      // \uC131\uACF5 \uCF5C\uBC31 \uD638\uCD9C (\uBAA8\uB2EC \uB2EB\uAE30 + \uD1A0\uC2A4\uD2B8 \uD45C\uC2DC)
      onSuccess?.()
    } catch (error) {
      console.error('Save to gallery error:', error)
      Alert.alert('\uC800\uC7A5 \uC2E4\uD328', '\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.')
    } finally {
      setIsSaving(false)
    }
  }, [])

  const shareImage = useCallback(async (
    captureImage: CaptureFunction,
    message: string = 'STORIX 프로필 카드',
  ) => {
    try {
      setIsSharing(true)

      const uri = await captureImage()
      if (!uri) {
        Alert.alert('\uC624\uB958', '\uC774\uBBF8\uC9C0\uB97C \uC0DD\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.')
        return
      }

      const isSharingAvailable = await Sharing.isAvailableAsync()
      if (!isSharingAvailable) {
        Alert.alert(
          '\uACF5\uC720 \uBD88\uAC00',
          '\uC774 \uAE30\uAE30\uC5D0\uC11C\uB294 \uACF5\uC720 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.',
        )
        return
      }

      const nativeShare = loadNativeShare()
      if (nativeShare) {
        await nativeShare.default.open({
          ...getOsShareOptions(uri, message),
          title: message,
          failOnCancel: false,
        })
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: message,
          UTI: 'public.png',
        })
      }
    } catch (error) {
      console.error('Share error:', error)
      Alert.alert('\uACF5\uC720 \uC2E4\uD328', '\uC774\uBBF8\uC9C0 \uACF5\uC720 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.')
    } finally {
      setIsSharing(false)
    }
  }, [])

  const shareToTwitter = useCallback(async (
    captureImage: CaptureFunction,
    message: string = 'STORIX \uD504\uB85C\uD544 \uCE74\uB4DC',
  ) => {
    try {
      setIsSharing(true)

      const uri = await captureImage()
      if (!uri) {
        Alert.alert('\uC624\uB958', '\uC774\uBBF8\uC9C0\uB97C \uC0DD\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.')
        return
      }

      if (Platform.OS === 'ios') {
        const shareUrl = await createWebShareUrlSafely(uri)
        await openTwitterIntent(shareUrl, message)
        return
      }

      const isTwitterInstalled = await isTwitterAppInstalled()
      if (!isTwitterInstalled) {
        const shareUrl = await createWebShareUrlSafely(uri)
        await openTwitterWebIntent(shareUrl, message)
        return
      }

      const nativeShare = loadNativeShare()
      if (!nativeShare) {
        const shareUrl = await createWebShareUrlSafely(uri)
        await openTwitterWebIntent(shareUrl, message)
        return
      }

      await nativeShare.default.shareSingle({
        social: nativeShare.Social.Twitter,
        url: normalizeShareUri(uri),
        type: 'image/png',
        message: getShareMessage(message),
      })
    } catch (error) {
      console.error('Twitter share error:', error)
      if (Platform.OS === 'ios') {
        await openTwitterIntent(undefined, message)
      } else {
        await openTwitterWebIntent(undefined, message)
      }
    } finally {
      setIsSharing(false)
    }
  }, [])

  return {
    saveToGallery,
    shareImage,
    shareToTwitter,
    isSaving,
    isSharing,
  }
}

function loadNativeShare(): NativeShareModule | null {
  try {
    return require('react-native-share') as NativeShareModule
  } catch (error) {
    if (__DEV__) {
      console.log('[cardShare] react-native-share unavailable', {
        message: error instanceof Error ? error.message : undefined,
      })
    }
    return null
  }
}

function normalizeShareUri(uri: string) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(uri)) return uri
  return `file://${uri}`
}

function getShareMessage(message: string) {
  return `${message} ${STORIX_SHARE_URL}`
}

function getOsShareOptions(uri: string, message: string) {
  const fileUri = normalizeShareUri(uri)
  const shareMessage = getShareMessage(message)

  if (Platform.OS === 'ios') {
    // NOTE: activityItemSources가 텍스트/이미지 항목을 모두 제공하므로,
    // 최상위 url/type을 함께 넘기면 이미지가 공유 시트에 두 번 첨부된다.
    return {
      subject: message,
      activityItemSources: [
        {
          placeholderItem: { type: 'text' as const, content: shareMessage },
          item: {
            default: { type: 'text' as const, content: shareMessage },
          },
          subject: {
            default: message,
          },
        },
        {
          placeholderItem: { type: 'url' as const, content: fileUri },
          item: {
            default: { type: 'url' as const, content: fileUri },
          },
          dataTypeIdentifier: {
            default: 'public.png',
          },
        },
      ],
    }
  }

  // Android: 메시지(텍스트 + URL)와 이미지를 함께 공유
  // NOTE: url과 urls를 함께 넘기면 일부 공유 대상(카카오톡 등)에서 이미지가 중복 첨부된다.
  return {
    message: shareMessage,
    url: fileUri,
    type: '*/*',
    subject: message,
    useInternalStorage: true,
  }
}

async function isTwitterAppInstalled() {
  if (Platform.OS === 'ios') {
    try {
      return Linking.canOpenURL(TWITTER_IOS_SCHEME)
    } catch {
      return false
    }
  }

  try {
    const nativeShare = loadNativeShare()
    if (!nativeShare) return false

    const result = await nativeShare.default.isPackageInstalled(TWITTER_ANDROID_PACKAGE)
    return result.isInstalled
  } catch {
    return false
  }
}

async function uploadProfileCardForWebShare(uri: string) {
  const contentType = 'image/png'
  const presigned = await postProfileCardImagePresignedUrl(contentType)

  await uploadProfileCardImage({
    url: presigned.url,
    uri,
    contentType,
  })

  const share = await createProfileCardShare(presigned.objectKey)
  return share.shareUrl
}

async function createWebShareUrlSafely(uri: string) {
  try {
    return await uploadProfileCardForWebShare(uri)
  } catch (error) {
    if (__DEV__) {
      const axiosError = error as {
        config?: { url?: string; method?: string; data?: unknown }
        response?: { status?: number; data?: unknown }
        message?: string
      }
      // Surface the exact endpoint/method that failed so the backend team
      // can pinpoint which call returned the error (presign vs. share).
      console.log('[cardShare] web share URL creation failed', {
        method: axiosError.config?.method?.toUpperCase(),
        endpoint: axiosError.config?.url,
        requestBody: axiosError.config?.data,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: error instanceof Error ? error.message : undefined,
      })
    }
    return undefined
  }
}

async function openTwitterIntent(shareUrl?: string, message: string = SHARE_MESSAGE) {
  const isTwitterInstalled = await isTwitterAppInstalled()
  if (!isTwitterInstalled) {
    await openTwitterWebIntent(shareUrl, message)
    return
  }

  const text = [getShareMessage(message), shareUrl].filter(Boolean).join(' ')
  const appUrl = `${TWITTER_IOS_POST_URL}?message=${encodeURIComponent(text)}`

  try {
    await Linking.openURL(appUrl)
  } catch {
    await openTwitterWebIntent(shareUrl, message)
  }
}

async function openTwitterWebIntent(shareUrl?: string, message: string = SHARE_MESSAGE) {
  const text = encodeURIComponent(getShareMessage(message))
  const query = shareUrl
    ? `text=${text}&url=${encodeURIComponent(shareUrl)}`
    : `text=${text}`
  const webIntentUrl = `${TWITTER_WEB_INTENT_URL}?${query}`

  try {
    const canOpenWebIntent = await Linking.canOpenURL(webIntentUrl)
    await Linking.openURL(canOpenWebIntent ? webIntentUrl : TWITTER_HOME_URL)
  } catch {
    await Linking.openURL(TWITTER_HOME_URL)
  }
}
