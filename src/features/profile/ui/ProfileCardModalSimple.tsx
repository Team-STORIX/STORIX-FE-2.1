import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator, useWindowDimensions, Platform } from 'react-native'
import { Image } from 'expo-image'
import { SvgXml } from 'react-native-svg'
import { useMemo, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ViewShot from 'react-native-view-shot'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'
import { XLogo } from '../../../components/common/XLogo'
import { useCardShare } from '../hooks/useCardShare'

const idCardTitle = require('../../../../assets/icons/profile/id-card-title.svg')
const fallbackGenreLogo = require('../../../../assets/logos/logo-pink.svg')
const closeIcon = require('../../../../assets/icons/common/x.svg')
const reviewIcon = require('../../../../assets/icons/profile/review.svg')
const likedIcon = require('../../../../assets/icons/profile/icon-liked.svg')
const libraryIcon = require('../../../../assets/icons/profile/icon-library.svg')
const downloadIcon = require('../../../../assets/icons/common/icon-download.svg')
const shareIcon = require('../../../../assets/icons/common/icon-share.svg')
const CARD_CAPTURE_SIZE = 322
const CARD_SCREEN_SIDE_MARGIN = 35
const ACTION_ROW_BOTTOM_OFFSET = 24

export type ProfileCardModalProps = {
  visible: boolean
  onClose: () => void
  nickname: string
  title?: string | null
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
  topGenreName,
  reviewCount = 0,
  onSaveSuccess,
}: ProfileCardModalProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const viewShotRef = useRef<ViewShot>(null)
  const { saveToGallery, shareImage, shareToTwitter, isSaving, isSharing } = useCardShare()
  const isIOS = Platform.OS === 'ios'
  const tintedTopGenreIconSvg = useMemo(
    () => tintSvg(topGenreIconSvg, Magenta[300]),
    [topGenreIconSvg],
  )
  const topGenreLabel = topGenreName?.trim() || '-'
  const trimmedTitle = title?.trim()
  const shouldShowTitleBadge = !!trimmedTitle && trimmedTitle !== '-'
  const cardDisplaySize = Math.max(0, screenWidth - CARD_SCREEN_SIDE_MARGIN * 2)
  const cardDisplayScale = cardDisplaySize / CARD_CAPTURE_SIZE
  const shareAnalytics = {
    contentType: 'profile_card' as const,
    itemId: 'profile_my_profile',
  }
  const shareMessage = 'STORIX 프로필 카드'

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
        <View style={styles.backdropDim} pointerEvents="none" />
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          {/* X 踰꾪듉 */}
          <Pressable style={[styles.closeButton, { top: insets.top + 16 }]} onPress={onClose}>
            <Image source={closeIcon} style={styles.closeIcon} contentFit="contain" tintColor={C.card} />
          </Pressable>

        <ViewShot ref={viewShotRef} style={styles.captureCardWrapper} options={{ format: 'png', quality: 1.0 }}>
          <View style={styles.cardContainer}>
            {/* ?곷떒 ?곸뿭: ?묓겕 + 寃??*/}
            <View style={styles.topRow}>
              {/* ?쇱そ ?묓겕 ?곸뿭 */}
              <View style={styles.pinkSection}>
                <Image source={idCardTitle} style={styles.idCardTitle} contentFit="contain" />

                <View style={styles.nicknameBadge}>
                  <Text style={styles.nicknameText} numberOfLines={1}>
                    {nickname}
                  </Text>
                </View>

                {shouldShowTitleBadge ? (
                  <View style={styles.titleBadge}>
                    <Text style={styles.titleText} numberOfLines={1}>
                      {trimmedTitle}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* ?ㅻⅨ履?寃???곸뿭 */}
              <View style={styles.blackSectionRight}>
                {tintedTopGenreIconSvg ? (
                  <SvgXml xml={tintedTopGenreIconSvg} width={142} height={142} />
                ) : (
                  <Image source={fallbackGenreLogo} style={styles.fallbackGenreLogo} contentFit="contain" />
                )}
              </View>
            </View>

            {/* ?섎떒 寃???곸뿭 */}
            <View style={styles.blackSectionBottom}>
              {/* 蹂꾩젏?됯퇏 */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>蹂꾩젏?됯퇏</Text>
                <View style={styles.statIconWrap}>
                  <Image source={reviewIcon} style={styles.statIcon} contentFit="contain" />
                </View>
              </View>

              {/* 理쒖븷?λⅤ */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{topGenreLabel}</Text>
                <Text style={styles.statLabel}>理쒖븷?λⅤ</Text>
                <View style={styles.statIconWrap}>
                  <Image source={likedIcon} style={styles.statIcon} contentFit="contain" />
                </View>
              </View>

              {/* ?묓뭹 由щ럭 */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reviewCount}</Text>
                <Text style={styles.statLabel}>?묓뭹 由щ럭</Text>
                <View style={styles.statIconWrap}>
                  <Image source={libraryIcon} style={styles.statIcon} contentFit="contain" />
                </View>
              </View>
            </View>
          </View>
        </ViewShot>

        <View style={[styles.contentWrapper, { width: cardDisplaySize, height: cardDisplaySize }]}>
          <Pressable
            style={[
              styles.cardContainer,
              styles.visibleCardContainer,
              { transform: [{ scale: cardDisplayScale }] },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
          {/* ?곷떒 ?곸뿭: ?묓겕 + 寃??*/}
          <View style={styles.topRow}>
            {/* ?쇱そ ?묓겕 ?곸뿭 */}
            <View style={styles.pinkSection}>
              <Image source={idCardTitle} style={styles.idCardTitle} contentFit="contain" />

              <View style={styles.nicknameBadge}>
                <Text style={styles.nicknameText} numberOfLines={1}>
                  {nickname}
                </Text>
              </View>

              {shouldShowTitleBadge ? (
                <View style={styles.titleBadge}>
                  <Text style={styles.titleText} numberOfLines={1}>
                    {trimmedTitle}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* ?ㅻⅨ履?寃???곸뿭 */}
            <View style={styles.blackSectionRight}>
              {tintedTopGenreIconSvg ? (
                <SvgXml xml={tintedTopGenreIconSvg} width={142} height={142} />
              ) : (
                <Image source={fallbackGenreLogo} style={styles.fallbackGenreLogo} contentFit="contain" />
              )}
            </View>
          </View>

          {/* ?섎떒 寃???곸뿭 */}
          <View style={styles.blackSectionBottom}>
            {/* 蹂꾩젏?됯퇏 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>蹂꾩젏 ?됯퇏</Text>
              <View style={styles.statIconWrap}>
                <Image source={reviewIcon} style={styles.statIcon} contentFit="contain" />
              </View>
            </View>

            {/* 理쒖븷?λⅤ */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{topGenreLabel}</Text>
              <Text style={styles.statLabel}>理쒖븷 ?λⅤ</Text>
              <View style={styles.statIconWrap}>
                <Image source={likedIcon} style={styles.statIcon} contentFit="contain" />
              </View>
            </View>

            {/* ?묓뭹 由щ럭 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reviewCount}</Text>
              <Text style={styles.statLabel}>由щ럭 ?묓뭹</Text>
              <View style={styles.statIconWrap}>
                <Image source={libraryIcon} style={styles.statIcon} contentFit="contain" />
              </View>
            </View>
          </View>
          </Pressable>
        </View>

          {/* ?섎떒 踰꾪듉 ?곸뿭 */}
          <View style={[styles.actionButtons, isIOS && styles.actionButtonsIOS, { bottom: insets.bottom + ACTION_ROW_BOTTOM_OFFSET }]}>
            {/* ???踰꾪듉 */}
            <Pressable
              onPress={() => {
                saveToGallery(captureCard, () => {
                  onClose()
                  onSaveSuccess?.()
                }, shareMessage, shareAnalytics)
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

            {/* 怨듭쑀 踰꾪듉 */}
            <Pressable
              onPress={() => shareImage(captureCard, shareMessage, shareAnalytics)}
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
              <Text style={styles.actionButtonText}>怨듭쑀</Text>
            </Pressable>

            {!isIOS ? (
              <Pressable
                onPress={() => shareToTwitter(captureCard, shareMessage, shareAnalytics)}
                disabled={isSharing}
                style={styles.actionButton}
              >
                <View style={styles.actionButtonCircle}>
                  {isSharing ? (
                    <ActivityIndicator size="small" color={Gray[900]} />
                  ) : (
                    <XLogo size={20} color={Gray[900]} />
                  )}
                </View>
                <Text style={styles.actionButtonText}>X??怨듭쑀</Text>
              </Pressable>
            ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardContainer: {
    width: CARD_CAPTURE_SIZE,
    height: CARD_CAPTURE_SIZE,
    // backgroundColor ?쒓굅 - ?묓겕/寃???곸뿭留?蹂댁씠?꾨줉
  },
  captureCardWrapper: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: CARD_CAPTURE_SIZE,
    height: CARD_CAPTURE_SIZE,
  },
  visibleCardContainer: {
    overflow: 'visible',
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
    width: 137, // 161 - 12*2 (醫뚯슦 ?⑤뵫)
    height: 72,
  },
  nicknameBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 44.722,
    backgroundColor: Gray[900],
    marginTop: 8,
  },
  nicknameText: {
    ...Typography.caption1Semibold,
    color: Magenta[300],
  },
  titleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 44.722,
    backgroundColor: Gray[900],
    marginTop: 4,
  },
  titleText: {
    ...Typography.caption1Medium,
    color: Magenta[300],
  },
  fallbackGenreLogo: {
    width: 142,
    height: 142,
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
    includeFontPadding: false,
  },
  statIconWrap: {
    width: 24,
    height: 24,
    marginTop: 16,
  },
  statIcon: {
    width: 24,
    height: 24,
  },
  actionButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 136,
    paddingHorizontal: 67,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonsIOS: {
    paddingHorizontal: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 88,
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
  actionButtonText: {
    ...Typography.caption1Medium,
    color: C.card,
    textAlign: 'center',
  },
})
