import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ViewShot from 'react-native-view-shot'
import Svg, {
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'
import { C, Gray, Typography } from '../../theme'
import { useCardShare } from '../../features/profile/hooks/useCardShare'

const recordCardTitle = require('../../../assets/icons/library/review-card-title.svg')
const closeIcon = require('../../../assets/icons/common/x.svg')
const downloadIcon = require('../../../assets/icons/common/icon-download.svg')
const shareIcon = require('../../../assets/icons/common/icon-share.svg')
const twitterIcon = require('../../../assets/icons/common/icon-twitter.svg')
const star = require('../../../assets/onboarding/star-gray.svg')
const storixLogo = require('../../../assets/logos/logo-white.svg')

const CARD_WIDTH = 322
const CARD_HEIGHT = 429
const REVIEW_CARD_OUTLINE =
  'M16 0H145C153.837 0 161 7.163 161 16C161 7.163 168.163 0 177 0H306C314.837 0 322 7.163 322 16V145C322 153.837 314.837 161 306 161C314.837 161 322 168.163 322 177V413C322 421.837 314.837 429 306 429H16C7.163 429 0 421.837 0 413V177C0 168.163 7.163 161 16 161C7.163 161 0 153.837 0 145V16C0 7.163 7.163 0 16 0Z'

export type RecordCardModalProps = {
  visible: boolean
  onClose: () => void
  coverImageUrl?: string | null
  nickname: string
  createdAt: string
  reviewContent: string
  worksTitle: string
  rating: number
  onSaveSuccess?: () => void
}

const formatDate = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const dateParts = trimmed.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (dateParts) {
    const [, yyyy, mm, dd] = dateParts
    return `${yyyy}.${mm.padStart(2, '0')}.${dd.padStart(2, '0')}`
  }

  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return trimmed

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function ReviewCardSurface({
  imageUrl,
  isMagentaTheme,
}: {
  imageUrl?: string | null
  isMagentaTheme: boolean
}) {
  return (
    <Svg
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <ClipPath id="reviewCardClip">
          <Path d={REVIEW_CARD_OUTLINE} />
        </ClipPath>
        {isMagentaTheme ? (
          <LinearGradient id="reviewCardGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF4093" stopOpacity={0} />
            <Stop offset="100%" stopColor="#FF4093" stopOpacity={1} />
          </LinearGradient>
        ) : (
          <LinearGradient id="reviewCardGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#000000" stopOpacity={0.15} />
            <Stop offset="35%" stopColor="#000000" stopOpacity={0.25} />
            <Stop offset="70%" stopColor="#000000" stopOpacity={0.65} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.95} />
          </LinearGradient>
        )}
      </Defs>

      <Path d={REVIEW_CARD_OUTLINE} fill="#131112" />
      <G clipPath="url(#reviewCardClip)">
        {imageUrl ? (
          <SvgImage
            x={0}
            y={0}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            href={{ uri: imageUrl }}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
        <Rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#reviewCardGradient)" />
      </G>
    </Svg>
  )
}

export function RecordCardModal({
  visible,
  onClose,
  coverImageUrl,
  nickname,
  createdAt,
  reviewContent,
  worksTitle,
  rating,
  onSaveSuccess,
}: RecordCardModalProps) {
  const insets = useSafeAreaInsets()
  const viewShotRef = useRef<ViewShot>(null)
  const [isMagentaTheme, setIsMagentaTheme] = useState(false)
  const { saveToGallery, shareImage, shareToTwitter, isSaving, isSharing } = useCardShare()

  const captureCard = async (): Promise<string | null> => {
    if (!viewShotRef.current) return null
    try {
      const uri = await viewShotRef.current.capture?.()
      return uri ?? null
    } catch (error) {
      console.error('Capture error:', error)
      return null
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Pressable style={[styles.closeButton, { top: insets.top + 16 }]} onPress={onClose}>
            <Image source={closeIcon} style={styles.closeIcon} contentFit="contain" tintColor={C.card} />
          </Pressable>

          <View style={styles.contentWrapper}>
            <Pressable
              style={styles.themeButton}
              onPress={(event) => {
                event.stopPropagation()
                setIsMagentaTheme((prev) => !prev)
              }}
            >
              <Text style={styles.themeButtonText}>테마 변경</Text>
            </Pressable>

            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
              <Pressable style={styles.cardContainer} onPress={(event) => event.stopPropagation()}>
                <ReviewCardSurface imageUrl={coverImageUrl} isMagentaTheme={isMagentaTheme} />

                <View style={styles.cardContent}>
                  <View style={styles.topSection}>
                    <Image source={recordCardTitle} style={styles.cardTitleImage} contentFit="contain" />
                    <Image source={storixLogo} style={styles.logoImage} contentFit="contain" />
                  </View>

                  <View style={styles.bottomSection}>
                    <View style={styles.ratingBadge}>
                      <Image source={star} style={styles.starIcon} contentFit="contain" tintColor="#FFE1ED" />
                      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>

                    <Text style={styles.worksTitle} numberOfLines={1}>
                      {worksTitle}
                    </Text>

                    <Text style={styles.reviewContent} numberOfLines={8}>
                      {truncateText(reviewContent, 220)}
                    </Text>

                    <Text style={styles.metaText}>
                      {nickname} · {formatDate(createdAt)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </ViewShot>

            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => {
                  saveToGallery(captureCard, () => {
                    onClose()
                    onSaveSuccess?.()
                  }, 'STORIX 기록카드')
                }}
                disabled={isSaving}
                style={styles.actionButton}
              >
                <View style={styles.actionButtonCircle}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Gray[900]} />
                  ) : (
                    <Image source={downloadIcon} style={styles.actionIcon} contentFit="contain" tintColor={Gray[900]} />
                  )}
                </View>
                <Text style={styles.actionButtonText}>저장</Text>
              </Pressable>

              <Pressable
                onPress={() => shareImage(captureCard, 'STORIX 기록카드')}
                disabled={isSharing}
                style={styles.actionButton}
              >
                <View style={styles.actionButtonCircle}>
                  {isSharing ? (
                    <ActivityIndicator size="small" color={Gray[900]} />
                  ) : (
                    <Image source={shareIcon} style={styles.actionIcon} contentFit="contain" tintColor={Gray[900]} />
                  )}
                </View>
                <Text style={styles.actionButtonText}>공유</Text>
              </Pressable>

              <Pressable
                onPress={() => shareToTwitter(captureCard, 'STORIX 기록카드')}
                style={styles.actionButton}
              >
                <View style={styles.actionButtonCircle}>
                  <Image source={twitterIcon} style={styles.twitterIcon} contentFit="contain" />
                </View>
                <Text style={styles.actionButtonText}>X에 공유</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 17, 18, 0.70)',
  },
  backdropPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 24,
    height: 24,
    zIndex: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  contentWrapper: {
    width: CARD_WIDTH,
  },
  themeButton: {
    position: 'absolute',
    top: -36,
    right: 0,
    zIndex: 20,
    minHeight: 26,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: C.card,
  },
  themeButtonText: {
    fontFamily: 'SUITBold',
    fontSize: 11,
    lineHeight: 15.4,
    color: Gray[900],
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleImage: {
    width: 227,
    height: 74,
  },
  logoImage: {
    width: 28,
    height: 28,
    marginTop: 4,
  },
  bottomSection: {
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderRadius: 13,
    backgroundColor: '#FF4093',
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  starIcon: {
    width: 14,
    height: 14,
  },
  ratingText: {
    fontFamily: 'SUITExtraBold',
    fontSize: 12,
    lineHeight: 16.8,
    color: '#FFE1ED',
  },
  worksTitle: {
    fontFamily: 'SUITBold',
    fontSize: 18,
    lineHeight: 25.2,
    color: C.card,
  },
  reviewContent: {
    fontFamily: 'SUITMedium',
    fontSize: 14,
    lineHeight: 19.6,
    color: C.card,
    textAlign: 'justify',
  },
  metaText: {
    fontFamily: 'SUITExtraBold',
    fontSize: 12,
    lineHeight: 16.8,
    color: C.card,
  },
  actionButtons: {
    height: 136,
    paddingHorizontal: 67,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  twitterIcon: {
    width: 48,
    height: 48,
  },
  actionButtonText: {
    ...Typography.caption1Medium,
    color: C.card,
    textAlign: 'center',
  },
})
