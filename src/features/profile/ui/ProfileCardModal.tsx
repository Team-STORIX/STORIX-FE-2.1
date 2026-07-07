import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { SvgXml } from 'react-native-svg'
import { useRef } from 'react'
import ViewShot from 'react-native-view-shot'
import { XLogo } from '../../../components/common/XLogo'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'
import { useCardShare } from '../hooks/useCardShare'

const idCardTitle = require('../../../../assets/icons/profile/id-card-title.svg')
const closeIcon = require('../../../../assets/icons/common/x.svg')
const reviewIcon = require('../../../../assets/icons/profile/review.svg')
const likedIcon = require('../../../../assets/icons/profile/icon-liked.svg')
const libraryIcon = require('../../../../assets/icons/profile/icon-library.svg')
const downloadIcon = require('../../../../assets/icons/common/icon-download.svg')
const shareIcon = require('../../../../assets/icons/common/icon-share.svg')

export type ProfileCardModalProps = {
  visible: boolean
  onClose: () => void
  nickname: string
  title: string
  topGenreIconSvg?: string
  averageRating?: number
  topGenreName?: string
  reviewCount?: number
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
}: ProfileCardModalProps) {
  const viewShotRef = useRef<ViewShot>(null)
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

  console.log('[ProfileCardModal] visible:', visible)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* X 버튼 */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Image source={closeIcon} style={styles.closeIcon} contentFit="contain" tintColor={C.card} />
        </Pressable>

        <View style={styles.contentWrapper}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={styles.cardContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
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

              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
            </View>

            {/* 오른쪽 검정 영역 */}
            <View style={styles.blackSectionRight}>
              {topGenreIconSvg && (
                <SvgXml xml={topGenreIconSvg} width={97} height={81} color={Magenta[300]} />
              )}
            </View>
          </View>

          {/* 하단 검정 영역 */}
          <View style={styles.blackSectionBottom}>
            {/* 별점평균 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>별점 평균</Text>
              <Image source={reviewIcon} style={styles.statIcon} contentFit="contain" />
            </View>

            {/* 최애장르 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{topGenreName}</Text>
              <Text style={styles.statLabel}>최애 장르</Text>
              <Image source={likedIcon} style={styles.statIcon} contentFit="contain" />
            </View>

            {/* 작품 리뷰 */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reviewCount}</Text>
              <Text style={styles.statLabel}>리뷰 작품</Text>
              <Image source={libraryIcon} style={styles.statIcon} contentFit="contain" />
            </View>
          </View>
            </Pressable>
          </ViewShot>

          {/* 하단 버튼 영역 */}
          <View style={styles.actionButtons}>
            {/* 저장 버튼 */}
            <Pressable
              onPress={() => saveToGallery(captureCard)}
              disabled={isSaving}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonCircle}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={Gray[900]} />
                ) : (
                  <Image source={downloadIcon} style={styles.actionIcon} contentFit="contain" />
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
                  <Image source={shareIcon} style={styles.actionIcon} contentFit="contain" />
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
                <XLogo size={20} color={Gray[900]} />
              </View>
              <Text style={styles.actionButtonText}>X에 공유</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000099',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
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
    backgroundColor: C.card,
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
    width: 137, // 161 - 12*2
    height: 20,
  },
  nicknameBadge: {
    maxWidth: 96,
    maxHeight: 23,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 44.722,
    backgroundColor: Magenta[200],
    marginTop: 12,
  },
  nicknameText: {
    ...Typography.caption1Semibold,
    color: C.card,
  },
  titleText: {
    ...Typography.caption1Medium,
    color: C.card,
    marginTop: 4,
  },
  blackSectionRight: {
    width: 161,
    height: 161,
    padding: 40,
    paddingHorizontal: 32,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Gray[900],
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    borderBottomLeftRadius: 0,
  },
  genreIcon: {
    width: 97, // 161 - 32*2
    height: 81, // 161 - 40*2
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
    height: 76,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
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
