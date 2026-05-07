import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { WorksMyReview } from '../../features/works/api/worksReview.schema'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'
import { ReviewMetaBar } from './ReviewMetaBar'
import { ReviewSpoilerBlock } from './ReviewSpoilerBlock'

const arrowForwardIcon = require('../../../assets/icons/common/icon-arrow-forward.svg')
const arrowSmallIcon = require('../../../assets/icons/common/icon-arrow-forward-small.svg')

type Props = {
  myReview?: WorksMyReview | null
  userName?: string
  onPressWrite: () => void
  onPressDetail: (reviewId: number) => void
}

export function MyReviewSection({
  myReview,
  userName,
  onPressWrite,
  onPressDetail,
}: Props) {
  const hasReview = !!myReview?.content
  const safeName = userName?.trim() || '유저'

  return (
    <View style={styles.section}>
      <Text style={styles.title}>내 리뷰</Text>

      {hasReview ? (
        <>
          <Pressable
            style={({ pressed }) => [styles.contentRow, pressed && styles.pressed]}
            onPress={() => {
              if (myReview?.reviewId != null) onPressDetail(myReview.reviewId)
            }}
          >
            <View style={styles.contentTextWrap}>
              <ReviewSpoilerBlock
                isSpoiler={myReview?.isSpoiler === true}
                spoilerScript={myReview?.spoilerScript}
                content={myReview?.content ?? ''}
                numberOfLines={2}
                backgroundColor={C.bg}
                textStyle={styles.contentText}
              />
            </View>
            <Image
              source={arrowForwardIcon}
              style={styles.arrowForward}
              contentFit="contain"
            />
          </Pressable>

          <View style={styles.metaRow}>
            <ReviewMetaBar
              rating={myReview?.rating ?? null}
              likeCount={myReview?.likeCount ?? 0}
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>아직 리뷰가 없어요!</Text>
          <Text style={styles.emptyTitle}>
            어서 {safeName}님의 감상을 나눠주세요!
          </Text>

          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
            onPress={onPressWrite}
            accessibilityRole="button"
            accessibilityLabel="리뷰 작성하기"
          >
            <Text style={styles.ctaText}>리뷰 작성하기</Text>
            <Image
              source={arrowSmallIcon}
              style={styles.ctaArrow}
              contentFit="contain"
            />
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  // -mx-4 → bleeds 16px on both sides; section bg = gray-50; bottom border 1px gray-100
  section: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
    paddingLeft: 4,
    paddingBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 20,
  },
  contentText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    paddingRight: 4,
  },
  contentTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  arrowForward: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  metaRow: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  emptyCard: {
    marginHorizontal: 4,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: C.card,
    borderRadius: Radius.md,
    alignItems: 'center',
    shadowColor: '#131112',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  emptyTitle: {
    ...Typography.body1Semibold,
    color: C.textSecondary,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#fdbcd9',
    backgroundColor: '#ffeef6',
  },
  ctaText: {
    ...Typography.body2Bold,
    color: C.primary,
  },
  ctaArrow: {
    width: 16,
    height: 16,
  },
  pressed: {
    opacity: 0.7,
  },
})
