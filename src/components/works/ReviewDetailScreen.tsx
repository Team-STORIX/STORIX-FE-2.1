import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import {
  useDeleteMyReview,
  useLikeWorksReview,
  useWorksReviewDetail,
} from '../../features/works/hooks/useWorksReviews'
import { useMe } from '../../features/profile'
import { useLikesStore } from '../../store/likes.store'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'
import { ReviewSpoilerBlock } from './ReviewSpoilerBlock'

const backIcon = require('../../../assets/icons/common/back.svg')
const reviewProfileIcon = require('../../../assets/icons/common/reviewProfile.svg')
const littleStarIcon = require('../../../assets/icons/common/littleStar.svg')
const likeIcon = require('../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../assets/icons/common/icon-like-pink.svg')
const menuDotsIcon = require('../../../assets/icons/common/menu-3dots.svg')

type Props = {
  reviewId: number
}

const formatKoreanDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${yyyy}.${mm}.${dd} (${day})`
}

export function ReviewDetailScreen({ reviewId }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const isValidReviewId = Number.isFinite(reviewId) && reviewId > 0
  const { data, isLoading, isError } = useWorksReviewDetail(
    isValidReviewId ? reviewId : 0,
  )

  const ui = useMemo(() => {
    const worksMetaParts: string[] = []
    if (data?.artistName) worksMetaParts.push(data.artistName)
    if (data?.worksType) worksMetaParts.push(data.worksType)

    return {
      worksId: data?.worksId ?? 0,
      userId: typeof data?.userId === 'number' ? data.userId : null,
      userName: data?.userName ?? '',
      profileImageUrl: data?.profileImageUrl ?? null,
      worksTitle: data?.worksName ?? '',
      worksMeta: worksMetaParts.join(' · '),
      coverSrc: data?.thumbnailUrl ?? null,
      rating: typeof data?.rating === 'number' ? data.rating : null,
      dateText: formatKoreanDate(data?.lastCreatedTime ?? data?.createdAt),
      content: data?.content ?? '',
      likeCount: typeof data?.likeCount === 'number' ? data.likeCount : 0,
      isLiked: !!data?.isLiked,
      isMineFlag: data?.isMine === true,
      isSpoiler: !!data?.isSpoiler,
      spoilerScript: data?.spoilerScript ?? '',
    }
  }, [data])

  const { data: meData } = useMe()
  const myUserId = typeof meData?.userId === 'number' ? meData.userId : null
  const isMine =
    ui.isMineFlag ||
    (myUserId != null && ui.userId != null && myUserId === ui.userId)

  const likeMutation = useLikeWorksReview({ worksId: ui.worksId })
  const deleteMutation = useDeleteMyReview({ worksId: ui.worksId })

  const storeIsLiked = useLikesStore(
    (state) => !!state.likedIds[String(reviewId)],
  )

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  useEffect(() => {
    setLiked(ui.isLiked || storeIsLiked)
    setLikeCount(ui.likeCount)
  }, [ui.isLiked, ui.likeCount, storeIsLiked])

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)' as const)
  }

  const onClickLike = async () => {
    if (likeMutation.isPending) return

    const prevLiked = liked
    const prevCount = likeCount

    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))

    setLiked(nextLiked)
    setLikeCount(nextCount)

    try {
      await likeMutation.mutateAsync(reviewId)
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    }
  }

  const onConfirmDelete = () => {
    if (deleteMutation.isPending) return
    Alert.alert('리뷰 삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(reviewId)
            if (ui.worksId) {
              router.replace(`/works/${ui.worksId}` as never)
            } else if (router.canGoBack()) {
              router.back()
            } else {
              router.replace('/(tabs)' as const)
            }
          } catch (e) {
            Alert.alert(
              '삭제 실패',
              e instanceof Error ? e.message : '리뷰 삭제에 실패했어요.',
            )
          }
        },
      },
    ])
  }

  if (!isValidReviewId) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <TopBar topInset={insets.top} onBack={handleBack} />
        <Text style={styles.statusText}>잘못된 리뷰 접근이에요</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <TopBar topInset={insets.top} onBack={handleBack} />
        <View style={styles.statusBlock}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.statusText}>리뷰를 불러오는 중이에요.</Text>
        </View>
      </View>
    )
  }

  if (isError || !data) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <TopBar topInset={insets.top} onBack={handleBack} />
        <Text style={styles.statusText}>리뷰를 불러오지 못했어요</Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar
        topInset={insets.top}
        onBack={handleBack}
        onPressMenu={isMine ? onConfirmDelete : undefined}
        showMenu={isMine}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User row */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Image
              source={
                ui.profileImageUrl
                  ? { uri: ui.profileImageUrl }
                  : reviewProfileIcon
              }
              style={styles.avatarImage}
              contentFit="cover"
            />
          </View>
          <View style={styles.userNameWrap}>
            <Text style={styles.userName} numberOfLines={1}>
              {ui.userName}
            </Text>
          </View>
        </View>

        {/* Works card */}
        <View style={styles.worksCard}>
          <View style={styles.coverWrap}>
            {ui.coverSrc ? (
              <Image
                source={{ uri: ui.coverSrc }}
                style={styles.cover}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
          </View>

          <View style={styles.worksInfo}>
            <Text style={styles.worksTitle} numberOfLines={1}>
              {ui.worksTitle}
            </Text>
            {ui.worksMeta ? (
              <Text style={styles.worksMeta} numberOfLines={1}>
                {ui.worksMeta}
              </Text>
            ) : null}

            {ui.rating !== null ? (
              <View style={styles.ratingChip}>
                <Image
                  source={littleStarIcon}
                  style={styles.ratingChipIcon}
                  contentFit="contain"
                />
                <Text style={styles.ratingChipText}>
                  {Number(ui.rating).toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Date + body */}
        <View style={styles.bodyArea}>
          {ui.dateText ? (
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{ui.dateText}</Text>
            </View>
          ) : null}

          <View style={styles.contentWrap}>
            <ReviewSpoilerBlock
              isSpoiler={ui.isSpoiler}
              spoilerScript={ui.spoilerScript}
              content={ui.content}
              backgroundColor={C.card}
              textStyle={styles.contentText}
              spoilerTextStyle={styles.detailSpoilerText}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.likeButton, pressed && styles.pressed]}
            onPress={onClickLike}
            disabled={likeMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel={liked ? '리뷰 좋아요 취소' : '리뷰 좋아요'}
          >
            <Image
              source={liked ? likePinkIcon : likeIcon}
              style={styles.likeIcon}
              contentFit="contain"
            />
            <Text style={styles.likeCount}>{likeCount}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

function TopBar({
  topInset,
  onBack,
  onPressMenu,
  showMenu = false,
}: {
  topInset: number
  onBack: () => void
  onPressMenu?: () => void
  showMenu?: boolean
}) {
  return (
    <View style={[topBarStyles.container, { paddingTop: topInset + 8 }]}>
      <Pressable
        style={({ pressed }) => [
          topBarStyles.iconButton,
          pressed && topBarStyles.pressed,
        ]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Image source={backIcon} style={topBarStyles.icon} contentFit="contain" />
      </Pressable>

      <Text style={topBarStyles.title}>리뷰</Text>

      <View style={topBarStyles.rightSpacer}>
        {showMenu && onPressMenu ? (
          <Pressable
            style={({ pressed }) => [
              topBarStyles.iconButton,
              pressed && topBarStyles.pressed,
            ]}
            onPress={onPressMenu}
            accessibilityRole="button"
            accessibilityLabel="메뉴"
          >
            <Image
              source={menuDotsIcon}
              style={topBarStyles.icon}
              contentFit="contain"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const topBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: C.card,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
  },
  rightSpacer: {
    width: 32,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
})

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  scroll: {
    flex: 1,
  },
  statusBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  userNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    ...Typography.body1Medium,
    color: C.text,
  },
  worksCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  coverWrap: {
    width: 87,
    height: 121,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: C.divider,
  },
  cover: {
    width: 87,
    height: 121,
  },
  coverFallback: {
    backgroundColor: C.divider,
  },
  worksInfo: {
    flex: 1,
    minWidth: 0,
  },
  worksTitle: {
    ...Typography.heading3,
    color: C.text,
  },
  worksMeta: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginTop: 4,
  },
  ratingChip: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 24,
  },
  ratingChipIcon: {
    width: 12,
    height: 12,
  },
  ratingChipText: {
    ...Typography.caption1Medium,
    color: C.primary,
  },
  bodyArea: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  dateRow: {
    borderLeftWidth: 2,
    borderLeftColor: C.textMuted,
    paddingLeft: 10,
  },
  dateText: {
    ...Typography.dateText,
  },
  contentWrap: {
    position: 'relative',
    minHeight: 64,
  },
  contentText: {
    ...Typography.body1Medium,
    color: C.textSecondary,
    lineHeight: 28,
  },
  detailSpoilerText: {
    ...Typography.body2Medium,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  likeIcon: {
    width: 20,
    height: 20,
  },
  likeCount: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
})
