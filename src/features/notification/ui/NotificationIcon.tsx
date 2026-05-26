import { Image, type ImageSource } from 'expo-image'
import { StyleSheet } from 'react-native'

// All notification glyphs are 24×24 and already magenta (#FF4093) in the asset.
// Do not fetch Figma remote URLs at runtime — bundle the local SVGs only.
const feedIcon = require('../../../../assets/notification/icon-feed.svg')
const reviewIcon = require('../../../../assets/notification/review.svg')
const topicRoomIcon = require('../../../../assets/notification/icon-contentshome-topicroom.svg')
const eventIcon = require('../../../../assets/notification/event-logo.svg')
const warningIcon = require('../../../../assets/notification/icon-warning.svg')
const speakerIcon = require('../../../../assets/notification/speaker.svg')

type IconSource = ImageSource | number

/**
 * Resolves the glyph for a notification from its (extensible) type/category.
 * Matching is keyword-based and case-insensitive so backend additions degrade
 * gracefully to the closest existing asset rather than crashing.
 */
function resolveIcon(notificationType?: string, category?: string): IconSource {
  const key = `${notificationType ?? ''} ${category ?? ''}`.toUpperCase()

  if (key.includes('REVIEW')) return reviewIcon
  if (key.includes('TOPIC')) return topicRoomIcon
  if (key.includes('EVENT') || key.includes('BENEFIT') || key.includes('AD'))
    return eventIcon
  if (
    key.includes('REPORT') ||
    key.includes('WARN') ||
    key.includes('VIOLATION')
  )
    return warningIcon
  if (
    key.includes('POLICY') ||
    key.includes('TERMS') ||
    key.includes('OPERATION') ||
    key.includes('NOTICE')
  )
    return speakerIcon
  if (key.includes('FEED') || key.includes('LIKE')) return feedIcon

  // Generic fallback — announcement/megaphone.
  return speakerIcon
}

type Props = {
  notificationType?: string
  category?: string
  size?: number
}

export function NotificationIcon({
  notificationType,
  category,
  size = 24,
}: Props) {
  return (
    <Image
      source={resolveIcon(notificationType, category)}
      style={[styles.icon, { width: size, height: size }]}
      contentFit="contain"
    />
  )
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
})
