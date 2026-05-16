import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useLikesStore } from '../../store/likes.store'
import type { WorksReviewItem } from '../../features/works'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'
import { ReviewMetaBar } from './ReviewMetaBar'
import { ReviewSpoilerBlock } from './ReviewSpoilerBlock'

const reviewProfileIcon = require('../../../assets/icons/common/reviewProfile.svg')
const arrowForwardIcon = require('../../../assets/icons/common/icon-arrow-forward.svg')

type Props = {
  item: WorksReviewItem
  onPressDetail: (reviewId: number) => void
  onPressLike: (reviewId: number) => void
  isLiking?: boolean
}

export function OtherReviewCard({
  item,
  onPressDetail,
  onPressLike,
  isLiking = false,
}: Props) {
  const isLiked = useLikesStore(
    (state) => !!state.likedIds[String(item.reviewId)],
  )

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Image
            source={
              item.profileImageUrl
                ? { uri: item.profileImageUrl }
                : reviewProfileIcon
            }
            style={styles.avatarImage}
            contentFit="cover"
          />
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {item.userName ?? '익명'}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.contentButton,
          pressed && styles.pressed,
        ]}
        onPress={() => onPressDetail(item.reviewId)}
      >
        <View style={styles.contentInner}>
          <View style={styles.contentTextWrap}>
            <ReviewSpoilerBlock
              isSpoiler={item.isSpoiler === true}
              spoilerScript={item.spoilerScript}
              content={item.content ?? ''}
              numberOfLines={3}
              backgroundColor={C.card}
              textStyle={styles.contentText}
            />
          </View>

          <Image
            source={arrowForwardIcon}
            style={styles.arrowForward}
            contentFit="contain"
          />
        </View>
      </Pressable>

      <View style={styles.metaRow}>
        <ReviewMetaBar
          rating={item.rating ?? null}
          likeCount={item.likeCount ?? 0}
          isLiked={isLiked}
          isLiking={isLiking}
          onPressLike={() => onPressLike(item.reviewId)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // 2.0: -mx-4 px-5 → 20 horizontal pad + bottomBorder 1px gray-100; left text
  card: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  headerRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  userName: {
    ...Typography.body2Medium,
    color: C.text,
    flex: 1,
  },
  contentButton: {
    paddingVertical: 20,
  },
  contentInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  contentTextWrap: {
    flex: 1,
    position: 'relative',
    minHeight: 24,
  },
  contentText: {
    ...Typography.body2Medium,
    color: C.textSecondary,
    paddingRight: 4,
  },
  arrowForward: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  metaRow: {
    paddingBottom: 20,
  },
  pressed: {
    opacity: 0.7,
  },
})
