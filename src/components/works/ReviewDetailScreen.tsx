import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  useDeleteMyReview,
  useLikeWorksReview,
  useReportWorksReview,
  useWorksReviewDetail,
} from '../../features/works/hooks/useWorksReviews'
import { useMe } from '../../features/profile'
import { blockUser } from '../../features/users/api/users.api'
import { useLikesStore } from '../../store/likes.store'
import { C, Gray } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'
import { formatCreatedAtLabel } from '../../lib/utils/formatCreatedAtLabel'
import { UserActionModal } from '../common/UserActionModal'
import { ReviewSpoilerBlock } from './ReviewSpoilerBlock'
import { RecordCardModal } from './RecordCardModal'

const backIcon = require('../../../assets/icons/common/back.svg')
const reviewProfileIcon = require('../../../assets/icons/common/reviewProfile.svg')
const littleStarIcon = require('../../../assets/icons/common/littleStar.svg')
const likeIcon = require('../../../assets/icons/common/icon-like.svg')
const likePinkIcon = require('../../../assets/icons/common/icon-like-pink.svg')
const menuDotsIcon = require('../../../assets/icons/common/menu-3dots.svg')
const savedToast = require('../../../assets/common/cardshare/image-gallery-saved.svg')

type Props = {
  reviewId: number
  source?: 'library'
  sourceWorksId?: number
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

// Pull a safe, user-facing message out of an API error.
// Never expose tokens or the whole response object — only the server message,
// and only log status/code/message in dev.
function getReportErrorMessage(error: unknown): string {
  const fallback = '신고 처리에 실패했어요. 다시 시도해 주세요.'
  const resp = (error as { response?: { status?: number; data?: any } })?.response
  const data = resp?.data
  const message = typeof data?.message === 'string' ? data.message : null
  if (__DEV__) {
    console.log('[worksReview][report] error', {
      status: resp?.status,
      code: data?.code,
      message: message ?? undefined,
    })
  }
  return message ?? fallback
}

export function ReviewDetailScreen({ reviewId, source, sourceWorksId }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [showRecordCard, setShowRecordCard] = useState(false)
  const [showSavedToast, setShowSavedToast] = useState(false)

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
  const reportMutation = useReportWorksReview()
  const qc = useQueryClient()

  // Moderation menu is only available on *other* users' reviews.
  const canModerate = !isMine && ui.userId != null

  // Kebab dropdown + confirm modals
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuDropdownTop, setMenuDropdownTop] = useState(0)
  const menuBtnRef = useRef<any>(null)
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [blockModalVisible, setBlockModalVisible] = useState(false)
  const relativeTime = formatCreatedAtLabel(
    data?.lastCreatedTime ?? data?.createdAt,
  )

  const handleMenuPress = () => {
    if (menuOpen) {
      setMenuOpen(false)
      return
    }
    menuBtnRef.current?.measure(
      (
        _fx: number,
        _fy: number,
        _w: number,
        h: number,
        _px: number,
        py: number,
      ) => {
        setMenuDropdownTop(py + h + 4)
        setMenuOpen(true)
      },
    )
  }

  // Close the dropdown first, then open the confirm modal on the next frame so
  // the dropdown Modal is gone before the confirm Modal mounts (avoids flicker
  // and stray touch events).
  const openReport = () => {
    setMenuOpen(false)
    requestAnimationFrame(() => setReportModalVisible(true))
  }
  const openBlock = () => {
    setMenuOpen(false)
    requestAnimationFrame(() => setBlockModalVisible(true))
  }
  const openEdit = () => {
    setMenuOpen(false)
    if (!ui.worksId) return
    router.push(`/review/write?worksId=${ui.worksId}&reviewId=${reviewId}` as never)
  }
  const openDelete = () => {
    setMenuOpen(false)
    requestAnimationFrame(onConfirmDelete)
  }

  const onConfirmReport = async () => {
    // Backend requires the actual review writer's id; never report myself.
    if (ui.userId == null || isMine) return
    if (__DEV__) {
      console.log('[worksReview][report] request', {
        reviewId,
        reportedUserId: ui.userId,
        reason: 'OTHER',
      })
    }
    await reportMutation.mutateAsync({
      reviewId,
      payload: {
        reportedUserId: ui.userId,
        reason: 'OTHER',
        otherReason: null,
      },
    })
  }

  const onConfirmBlock = async () => {
    if (ui.userId == null || isMine) return
    await blockUser(ui.userId)
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['works', 'review', 'list', ui.worksId] }),
      qc.invalidateQueries({ queryKey: ['works', 'review', 'detail', reviewId] }),
      qc.invalidateQueries({ queryKey: ['worksReviews'] }),
      qc.invalidateQueries({ queryKey: ['allBoards'] }),
      qc.invalidateQueries({ queryKey: ['boardsByWorksId'] }),
    ])
  }

  const onReportError = (error: unknown) => {
    Alert.alert('신고 실패', getReportErrorMessage(error))
  }

  const onBlockError = () => {
    Alert.alert('차단 실패', '차단 처리에 실패했어요. 다시 시도해 주세요.')
  }

  const navigateToWorksWithActionToast = (action: 'report' | 'block') => {
    if (ui.worksId) {
      router.replace(
        `/works/${ui.worksId}?tab=review&actionToast=${action}` as never,
      )
      return
    }
    router.replace('/(tabs)' as const)
  }

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
    if (source === 'library') {
      const targetWorksId =
        sourceWorksId != null && Number.isFinite(sourceWorksId) && sourceWorksId > 0
          ? sourceWorksId
          : ui.worksId

      if (targetWorksId) {
        router.replace(`/works/${targetWorksId}` as never)
        return
      }
    }

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
        onPressMenu={isMine ? handleMenuPress : undefined}
        menuButtonRef={menuBtnRef}
        showMenu={isMine}
        onPressRecordCard={() => setShowRecordCard(true)}
        showRecordCard={isMine}
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
          <View style={styles.userMeta}>
            <Text style={styles.userName} numberOfLines={1}>
              {ui.userName}
            </Text>
            {relativeTime ? (
              <Text style={styles.userTime}>{relativeTime}</Text>
            ) : null}
          </View>

          {canModerate ? (
            <Pressable
              ref={menuBtnRef}
              hitSlop={8}
              onPress={handleMenuPress}
              style={styles.userMenuBtn}
              accessibilityRole="button"
              accessibilityLabel="리뷰 메뉴"
            >
              <Image
                source={menuDotsIcon}
                style={styles.userMenuIcon}
                contentFit="contain"
              />
            </Pressable>
          ) : null}
        </View>

        {/* 케밥 드롭다운 */}
        {menuOpen && (
          <Modal
            transparent
            visible
            animationType="none"
            onRequestClose={() => setMenuOpen(false)}
          >
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setMenuOpen(false)}
            >
              <View style={[styles.menuDropdown, { top: menuDropdownTop }]}>
                <View style={styles.menuTextWrapper}>
                  {isMine ? (
                    <>
                      <Pressable style={styles.menuTextItem} onPress={openEdit}>
                        <Text style={styles.menuTextItemText}>수정하기</Text>
                      </Pressable>
                      <View style={styles.menuDivider} />
                      <Pressable style={styles.menuTextItem} onPress={openDelete}>
                        <Text style={styles.menuTextItemText}>삭제하기</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable style={styles.menuTextItem} onPress={openReport}>
                        <Text style={styles.menuTextItemText}>신고하기</Text>
                      </Pressable>
                      <View style={styles.menuDivider} />
                      <Pressable style={styles.menuTextItem} onPress={openBlock}>
                        <Text style={styles.menuTextItemText}>차단하기</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          </Modal>
        )}

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

      {/* 신고 확인 팝업 */}
      <UserActionModal
        type="report"
        visible={reportModalVisible}
        profileImageUrl={ui.profileImageUrl}
        nickname={ui.userName}
        onClose={() => setReportModalVisible(false)}
        onConfirm={onConfirmReport}
        onError={onReportError}
        onSuccess={() => navigateToWorksWithActionToast('report')}
        showCompletionPopup={false}
      />

      {/* 차단 확인 팝업 */}
      <UserActionModal
        type="block"
        visible={blockModalVisible}
        profileImageUrl={ui.profileImageUrl}
        nickname={ui.userName}
        onClose={() => setBlockModalVisible(false)}
        onConfirm={onConfirmBlock}
        onError={onBlockError}
        onSuccess={() => navigateToWorksWithActionToast('block')}
        showCompletionPopup={false}
      />

      {/* 기록카드 모달 */}
      <RecordCardModal
        visible={showRecordCard}
        onClose={() => setShowRecordCard(false)}
        coverImageUrl={ui.coverSrc}
        nickname={ui.userName}
        createdAt={data?.lastCreatedTime ?? data?.createdAt ?? ''}
        reviewContent={ui.content}
        worksTitle={ui.worksTitle}
        rating={ui.rating ?? 0}
        onSaveSuccess={() => {
          setShowSavedToast(true)
          setTimeout(() => setShowSavedToast(false), 1500)
        }}
      />

      {/* 저장 완료 토스트 */}
      {showSavedToast && (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={[styles.toastContainer, { bottom: 88 }]} pointerEvents="none">
            <Image source={savedToast} style={styles.toastImage} contentFit="contain" />
          </View>
        </Modal>
      )}
    </View>
  )
}

function TopBar({
  topInset,
  onBack,
  onPressMenu,
  menuButtonRef,
  showMenu = false,
  onPressRecordCard,
  showRecordCard = false,
}: {
  topInset: number
  onBack: () => void
  onPressMenu?: () => void
  menuButtonRef?: Ref<any>
  showMenu?: boolean
  onPressRecordCard?: () => void
  showRecordCard?: boolean
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

      <View style={[topBarStyles.titleWrapper, { top: topInset + 8 }]}>
        <Text style={topBarStyles.title}>리뷰</Text>
      </View>

      <View style={topBarStyles.rightActions}>
        {showRecordCard && onPressRecordCard && (
          <Pressable
            style={({ pressed }) => [
              topBarStyles.recordCardButton,
              pressed && topBarStyles.pressed,
            ]}
            onPress={onPressRecordCard}
            accessibilityRole="button"
            accessibilityLabel="기록카드"
          >
            <Text style={topBarStyles.recordCardText}>기록카드</Text>
          </Pressable>
        )}
        {showMenu && onPressMenu ? (
          <Pressable
            ref={menuButtonRef}
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
        ) : <View style={{ width: 32, height: 32 }} />}
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
  titleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordCardButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E3DCDF',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCardText: {
    fontFamily: 'SUIT',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16.8,
    color: '#645C5F',
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
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    ...Typography.body2Medium,
    color: Gray[900],
  },
  userTime: {
    fontFamily: 'SUIT',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    color: Gray[400],
  },
  userMenuBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMenuIcon: {
    width: 24,
    height: 24,
  },
  menuDropdown: {
    position: 'absolute',
    right: 16,
    width: 96,
    padding: 8,
    borderRadius: 4,
    backgroundColor: C.card,
    shadowColor: C.text,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  menuTextWrapper: {
    width: '100%',
  },
  menuTextItem: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuTextItemText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  menuDivider: {
    height: 1,
    backgroundColor: Gray[200],
    marginVertical: 6,
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
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  toastImage: {
    width: 320,
    height: 82,
  },
})
