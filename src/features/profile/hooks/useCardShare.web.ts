import { useCallback, useState } from 'react'

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
const TWITTER_WEB_INTENT_URL = 'https://twitter.com/intent/tweet'

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

      const uri = await captureImage()
      if (!uri) {
        window.alert('이미지를 생성할 수 없습니다.')
        return
      }

      downloadUri(uri, 'storix-profile-card.png')
      await trackCardExport(analytics)
      onSuccess?.()
    } catch (error) {
      console.error('Save to gallery error:', error)
      window.alert('이미지 저장 중 오류가 발생했습니다.')
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
        window.alert('이미지를 생성할 수 없습니다.')
        return
      }

      const shareData = {
        title: message,
        text: getShareMessage(message),
        url: STORIX_SHARE_URL,
      }

      if (navigator.share) {
        await navigator.share(shareData)
        await trackCardShareSheet(analytics)
        return
      }

      downloadUri(uri, 'storix-profile-card.png')
      await trackCardShareSheet(analytics)
    } catch (error) {
      console.error('Share error:', error)
      window.alert('이미지 공유 중 오류가 발생했습니다.')
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
      const shareUrl = uri ? await createWebShareUrlSafely(uri) : undefined
      openTwitterWebIntent(shareUrl, message)
      await trackTwitterShare(analytics)
    } catch (error) {
      console.error('Twitter share error:', error)
      openTwitterWebIntent(undefined, message)
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

function downloadUri(uri: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = uri
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function getShareMessage(message: string) {
  return `${message} ${STORIX_SHARE_URL}`
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
      console.log('[cardShare] web share URL creation failed', {
        message: error instanceof Error ? error.message : undefined,
      })
    }
    return undefined
  }
}

function openTwitterWebIntent(shareUrl?: string, message: string = SHARE_MESSAGE) {
  const text = encodeURIComponent(getShareMessage(message))
  const query = shareUrl
    ? `text=${text}&url=${encodeURIComponent(shareUrl)}`
    : `text=${text}`

  window.open(`${TWITTER_WEB_INTENT_URL}?${query}`, '_blank', 'noopener,noreferrer')
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
