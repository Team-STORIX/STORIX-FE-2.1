import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { SvgXml } from 'react-native-svg'
import { useMemo, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import ViewShot from 'react-native-view-shot'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'
import { useCardShare } from '../hooks/useCardShare'

const idCardTitle = require('../../../../assets/icons/profile/id-card-title.svg')
const closeIcon = require('../../../../assets/icons/common/x.svg')
const reviewIcon = require('../../../../assets/icons/profile/review.svg')
const likedIcon = require('../../../../assets/icons/profile/icon-liked.svg')
const libraryIcon = require('../../../../assets/icons/profile/icon-library.svg')
const downloadIcon = require('../../../../assets/icons/common/icon-download.svg')
const shareIcon = require('../../../../assets/icons/common/icon-share.svg')
const twitterIcon = require('../../../../assets/icons/common/icon-twitter.svg')

export type ProfileCardModalProps = {
  visible: boolean
  onClose: () => void
  nickname: string
  title: string
  topGenreIconSvg?: string
  averageRating?: number
  topGenreName?: string
  reviewCount?: number
  onSaveSuccess?: () => void
}

export function ProfileCardModal({
  visible,
  onClose,
  nickname,
  title,
  topGenreIconSvg,
  averageRating = 0,
  topGenreName = '로맨스',
  reviewCount = 0,
  onSaveSuccess,
}: ProfileCardModalProps) {
  const insets = useSafeAreaInsets()
  const viewShotRef = useRef<ViewShot>(null)
  const { saveToGallery, shareImage, shareToTwitter, isSaving, isSharing } = useCardShare()
  const tintedTopGenreIconSvg = useMemo(
    () => tintSvg(topGenreIconSvg, Magenta[300]),
    [topGenreIconSvg],
  )

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
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
        <View style={styles.backdropDim} pointerEvents="none" />
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          {/* X 버튼 */}
          <Pressable style={[styles.closeButton, { top: insets.top + 16 }]} onPress={onClose}>
            <Image source={closeIcon} style={styles.closeIcon} contentFit="contain" tintColor={C.card} />
          </Pressable>

        <View style={styles.contentWrapper}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
            <Pressable style={styles.cardContainer} onPress={(e) => e.stopPropagation()}>
          {/* 상단 영역: 핑크 + 검정 */}
          <View style={styles.topRow}>
            {/* 왼쪽 핑크 영역 */}
            <View style={styles.pinkSection}>
              <Image source={idCardTitle} style={styles.idCardTitle} contentFit="contain" />

              <View style={styles.nicknameBadge}>
                <Text style={styles.nicknameText} numberOfLines={1}>
                  {nickname}
                </Text>
              </View>

              <View style={styles.titleBadge}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            </View>

            {/* 오른쪽 검정 영역 */}
            <View style={styles.blackSectionRight}>
              {tintedTopGenreIconSvg ? (
                <SvgXml xml={tintedTopGenreIconSvg} width={142} height={142} />
              ) : (
                <View style={styles.genreIconPlaceholder} />
              )}
            </View>
          </View>

          {/* 하단 검정 영역 */}
          <View style={styles.blackSectionBottom}>
            {/* 별점평균 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>별점평균</Text>
              <Image source={reviewIcon} style={styles.statIcon} contentFit="contain" />
            </View>

            {/* 최애장르 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{topGenreName}</Text>
              <Text style={styles.statLabel}>최애장르</Text>
              <Image source={likedIcon} style={styles.statIcon} contentFit="contain" />
            </View>

            {/* 작품 리뷰 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reviewCount}</Text>
              <Text style={styles.statLabel}>작품 리뷰</Text>
              <Image source={libraryIcon} style={styles.statIcon} contentFit="contain" />
            </View>
          </View>
            </Pressable>
          </ViewShot>

          {/* 하단 버튼 영역 */}
          <View style={styles.actionButtons}>
            {/* 저장 버튼 */}
            <Pressable
              onPress={() => {
                saveToGallery(captureCard, () => {
                  onClose()
                  onSaveSuccess?.()
                })
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

            {/* 공유 버튼 */}
            <Pressable
              onPress={() => shareImage(captureCard)}
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

            {/* X(트위터) 공유 버튼 */}
            <Pressable
              onPress={() => shareToTwitter(captureCard)}
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

function tintSvg(svg: string | undefined, color: string) {
  if (!svg) return undefined

  return svg
    .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="(?!none)[^"]*"/g, `stroke="${color}"`)
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
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
    width: 322,
  },
  cardContainer: {
    // backgroundColor 제거 - 핑크/검정 영역만 보이도록
  },
  topRow: {
    flexDirection: 'row',
  },
  pinkSection: {
    width: 161,
    height: 161,
    paddingTop: 13,
    paddingBottom: 13,
    paddingHorizontal: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: Magenta[300],
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: Radius.lg,
  },
  idCardTitle: {
    width: 137, // 161 - 12*2 (좌우 패딩)
    height: 72,
  },
  nicknameBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 44.722,
    backgroundColor: Magenta[200],
    marginTop: 8,
  },
  nicknameText: {
    ...Typography.caption1Semibold,
    color: C.card,
  },
  titleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 44.722,
    backgroundColor: Magenta[200],
    marginTop: 4,
  },
  titleText: {
    ...Typography.caption1Medium,
    color: C.card,
  },
  genreIconPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Gray[800],
  },
  blackSectionRight: {
    width: 161,
    height: 161,
    padding: 9.5,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Gray[900],
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    borderBottomLeftRadius: 0,
  },
  blackSectionBottom: {
    width: 322,
    height: 161,
    paddingTop: 33,
    paddingBottom: 33,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Gray[900],
    borderRadius: Radius.lg,
  },
  statItem: {
    width: 56,
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading2,
    color: Magenta[200],
    textAlign: 'center',
  },
  statLabel: {
    ...Typography.caption1Medium,
    color: Magenta[200],
    textAlign: 'center',
    marginTop: 4,
  },
  statIcon: {
    width: 24,
    height: 24,
    marginTop: 16,
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
