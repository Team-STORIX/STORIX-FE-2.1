import { useCallback, useState } from 'react'
import { Alert, Linking } from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import Share, { Social } from 'react-native-share'
import {
  createProfileCardShare,
  postProfileCardImagePresignedUrl,
  uploadProfileCardImage,
} from '../api/profile-card-share.api'

export type CaptureFunction = () => Promise<string | null>

const SHARE_MESSAGE = 'STORIX \uD504\uB85C\uD544 \uCE74\uB4DC'
const TWITTER_ANDROID_PACKAGE = 'com.twitter.android'
const TWITTER_WEB_INTENT_URL = 'https://twitter.com/intent/tweet'
const TWITTER_HOME_URL = 'https://twitter.com'

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

      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          '\uAD8C\uD55C \uD544\uC694',
          '\uAC24\uB7EC\uB9AC\uC5D0 \uC800\uC7A5\uD558\uB824\uBA74 \uC0AC\uC9C4 \uC811\uADFC \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.',
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

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: '\uD504\uB85C\uD544 \uCE74\uB4DC \uACF5\uC720',
      })
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

      const isTwitterInstalled = await isTwitterAppInstalled()
      if (!isTwitterInstalled) {
        const shareUrl = await uploadProfileCardForWebShare(uri)
        await openTwitterWebIntent(shareUrl, message)
        return
      }

      await Share.shareSingle({
        social: Social.Twitter,
        url: normalizeShareUri(uri),
        type: 'image/png',
        message,
      })
    } catch (error) {
      console.error('Twitter share error:', error)
      await openTwitterWebIntent(undefined, message)
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

function normalizeShareUri(uri: string) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(uri)) return uri
  return `file://${uri}`
}

async function isTwitterAppInstalled() {
  try {
    const result = await Share.isPackageInstalled(TWITTER_ANDROID_PACKAGE)
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

async function openTwitterWebIntent(shareUrl?: string, message: string = SHARE_MESSAGE) {
  const text = encodeURIComponent(message)
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
