import { useCallback, useState } from 'react'
import { Alert, Linking, Platform } from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import {
  createProfileCardShare,
  postProfileCardImagePresignedUrl,
  uploadProfileCardImage,
} from '../api/profile-card-share.api'
import {
  trackExportProfileCard,
  trackExportReviewCard,
  trackOpenShareSheet,
  trackShare,
} from '../../../lib/analytics/events'

export type CaptureFunction = () => Promise<string | null>
export type CardShareAnalytics =
  | { contentType: 'profile_card'; itemId: string }
  | { contentType: 'review_card'; itemId: string; workId: string }

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
    message: string = SHARE_MESSAGE,
    analytics?: CardShareAnalytics,
  ) => {
    try {
      setIsSaving(true)

      const { status } = await MediaLibrary.requestPermissionsAsync(true)
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '갤러리에 저장하려면 사진 저장 권한이 필요합니다.',
        )
        return
      }

      const uri = await captureImage()
      if (!uri) {
        Alert.alert('오류', '이미지를 생성할 수 없습니다.')
        return
      }

      await MediaLibrary.saveToLibraryAsync(uri)
      await trackCardExport(analytics)
      onSuccess?.()
    } catch (error) {
      console.error('Save to gallery error:', error)
      Alert.alert('저장 실패', '이미지 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }, [])

  const shareImage = useCallback(async (
    captureImage: CaptureFunction,
    message: string = SHARE_MESSAGE,
    analytics?: CardShareAnalytics,
  ) => {
    try {
      setIsSharing(true)

      const uri = await captureImage()
      if (!uri) {
        Alert.alert('오류', '이미지를 생성할 수 없습니다.')
        return
      }

      const isSharingAvailable = await Sharing.isAvailableAsync()
      if (!isSharingAvailable) {
        Alert.alert(
          '공유 불가',
          '이 기기에서는 공유 기능을 사용할 수 없습니다.',
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
      await trackCardShareSheet(analytics)
    } catch (error) {
      console.error('Share error:', error)
      Alert.alert('공유 실패', '이미지 공유 중 오류가 발생했습니다.')
    } finally {
      setIsSharing(false)
    }
  }, [])

  const shareToTwitter = useCallback(async (
    captureImage: CaptureFunction,
    message: string = SHARE_MESSAGE,
    analytics?: CardShareAnalytics,
  ) => {
    try {
      setIsSharing(true)

      const uri = await captureImage()
      if (!uri) {
        Alert.alert('오류', '이미지를 생성할 수 없습니다.')
        return
      }

      if (Platform.OS === 'ios') {
        const shareUrl = await createWebShareUrlSafely(uri)
        await openTwitterIntent(shareUrl, message)
        await trackTwitterShare(analytics)
        return
      }

      const isTwitterInstalled = await isTwitterAppInstalled()
      if (!isTwitterInstalled) {
        const shareUrl = await createWebShareUrlSafely(uri)
        await openTwitterWebIntent(shareUrl, message)
        await trackTwitterShare(analytics)
        return
      }

      const nativeShare = loadNativeShare()
      if (!nativeShare) {
        const shareUrl = await createWebShareUrlSafely(uri)
        await openTwitterWebIntent(shareUrl, message)
        await trackTwitterShare(analytics)
        return
      }

      await nativeShare.default.shareSingle({
        social: nativeShare.Social.Twitter,
        url: normalizeShareUri(uri),
        type: 'image/png',
        message: getShareMessage(message),
      })
      await trackTwitterShare(analytics)
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

async function trackCardExport(analytics?: CardShareAnalytics) {
  if (!analytics) return

  if (analytics.contentType === 'profile_card') {
    await trackExportProfileCard({ profile_type: 'my_profile' })
    return
  }

  await trackExportReviewCard({
    review_id: analytics.itemId,
    work_id: analytics.workId,
  })
}

async function trackCardShareSheet(analytics?: CardShareAnalytics) {
  if (!analytics) return

  await trackOpenShareSheet({
    content_type: analytics.contentType,
    item_id: analytics.itemId,
  })
}

async function trackTwitterShare(analytics?: CardShareAnalytics) {
  if (!analytics) return

  await trackCardShareSheet(analytics)
  await trackShare({
    method: 'x',
    content_type: analytics.contentType,
    item_id: analytics.itemId,
  })
}
