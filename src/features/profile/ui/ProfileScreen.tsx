import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Magenta } from '../../../theme'
import { useMe } from '../hooks'
import { useProfileRatings } from '../hooks/useProfileRatings'
import { useProfileGenreStats } from '../hooks/useProfileGenreStats'
import { ProfileActivityContent } from './ProfileActivityContent'
import { ProfileHashtagSection } from './ProfileHashtagSection'
import {
  GENRE_SVG as PROFILE_GENRE_SVG,
  ProfilePreferGenreSection,
  genreLabels as profileGenreLabels,
  normalizeGenreKey,
} from './ProfilePreferGenreSection'
import { ProfilePreferenceSection } from './ProfilePreferenceSection'
import { ProfilePreferenceTabs, type ProfilePreferenceTab } from './ProfilePreferenceTabs'
import { ProfileRatingSection } from './ProfileRatingSection'
import { ProfileTopBar } from './ProfileTopBar'
import { ProfileUserSummary } from './ProfileUserSummary'
import { LevelProgress } from './LevelProgress'
import { ProfileCardModal } from './ProfileCardModalSimple'
import type { ProfileActivityTab } from './ProfileActivityTabs'

const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const
const savedToast = require('../../../../assets/common/cardshare/image-gallery-saved.svg')
const profileEditToast = require('../../../../assets/common/cardshare/profile-fix-toast.svg')
const PROFILE_TAB_BAR_HEIGHT = 80
const PROFILE_CARD_TOAST_NAV_GAP = 36
const PROFILE_EDIT_TOAST_BOTTOM = 36

const GENRE_SVG: Record<string, string> = {
  ROMANCE: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M63.0588 23.8667H60.1765C59.379 23.8667 58.7353 23.2116 58.7353 22.4V18H47.2059V22.4C47.2059 23.2116 46.5525 23.8667 45.7647 23.8667H34.2353C33.4378 23.8667 32.7941 23.2116 32.7941 22.4V18H21.2647V22.4C21.2647 23.2116 20.6114 23.8667 19.8235 23.8667H15.5V44.4H19.8235C20.6114 44.4 21.2647 45.0551 21.2647 45.8667V50.2667H25.5882C26.3761 50.2667 27.0294 50.9218 27.0294 51.7333V56.1333H31.3529C32.1408 56.1333 32.7941 56.7884 32.7941 57.6V62H47.2059V57.6C47.2059 56.7884 47.8496 56.1333 48.6471 56.1333H52.9706V51.7333C52.9706 50.9218 53.6143 50.2667 54.4118 50.2667H58.7353V45.8667C58.7353 45.0551 59.379 44.4 60.1765 44.4H64.5V23.8667H63.0588ZM57.2941 44.4H52.9706V48.8C52.9706 49.6116 52.3173 50.2667 51.5294 50.2667H47.2059V54.6667C47.2059 55.4782 46.5525 56.1333 45.7647 56.1333H34.2353C33.4378 56.1333 32.7941 55.4782 32.7941 54.6667V50.2667H28.4706C27.6731 50.2667 27.0294 49.6116 27.0294 48.8V44.4H22.7059C21.9084 44.4 21.2647 43.7449 21.2647 42.9333V25.3333C21.2647 24.5218 21.9084 23.8667 22.7059 23.8667H31.3529C32.1408 23.8667 32.7941 24.5218 32.7941 25.3333V29.7333H47.2059V25.3333C47.2059 24.5218 47.8496 23.8667 48.6471 23.8667H57.2941C58.082 23.8667 58.7353 24.5218 58.7353 25.3333V42.9333C58.7353 43.7449 58.082 44.4 57.2941 44.4Z" fill="#010101"/></svg>`,
  // 다른 장르 SVG들은 필요시 추가
}

const genreLabels: Record<string, string> = {
  FANTASY: '판타지',
  ACTION: '무협',
  MODERN_FANTASY: '현판',
  ROMANCE: '로맨스',
  ROFAN: '로판',
  DAILY: '일상',
  BL: 'BL',
  THRILLER: '스릴러',
  DRAMA: '드라마',
  HISTORICAL: '사극',
}

const getLevelTitle = (level: number): string => {
  if (level >= 100) return '전설의 독자'
  if (level >= 90) return '명예 독자'
  if (level >= 80) return '마스터 독자'
  if (level >= 70) return '엘리트 독자'
  if (level >= 60) return '베테랑 독자'
  if (level >= 50) return '숙련 독자'
  if (level >= 40) return '중견 독자'
  if (level >= 30) return '열정 독자'
  if (level >= 20) return '성장 독자'
  if (level >= 10) return '활발한 독자'
  if (level >= 5) return '새싹 독자'
  return '신입 독자'
}

export function ProfileScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ profileEditToast?: string }>()
  const insets = useSafeAreaInsets()
  const { data: me, isLoading, isError } = useMe()
  const [activeTab, setActiveTab] = useState<ProfilePreferenceTab>('analysis')
  const [activeActivityTab, setActiveActivityTab] = useState<ProfileActivityTab>('posts')
  const [showCardModal, setShowCardModal] = useState(false)
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [showProfileEditToast, setShowProfileEditToast] = useState(false)
  const lastProfileEditToastRef = useRef<string | undefined>(undefined)
  const savedToastBottom =
    insets.bottom + PROFILE_TAB_BAR_HEIGHT + PROFILE_CARD_TOAST_NAV_GAP
  const profileEditToastBottom = insets.bottom + PROFILE_EDIT_TOAST_BOTTOM

  const ratingsQuery = useProfileRatings()
  const genreStatsQuery = useProfileGenreStats()

  useEffect(() => {
    const toastKey = params.profileEditToast
    if (!toastKey || lastProfileEditToastRef.current === toastKey) return

    lastProfileEditToastRef.current = toastKey
    setShowProfileEditToast(true)
    const timer = setTimeout(() => setShowProfileEditToast(false), 1500)
    return () => clearTimeout(timer)
  }, [params.profileEditToast])

  // 평균 별점 및 리뷰 수 계산
  const { averageRating, totalReviews } = useMemo(() => {
    const ratingCounts = ratingsQuery.data ?? {}
    const parsed: Record<number, number> = {}

    for (const [key, value] of Object.entries(ratingCounts)) {
      const normalized = key.trim().replace(/_/g, '.')
      const match = normalized.match(/(\d+(\.\d+)?)/g)
      const numericKey = match ? match[match.length - 1] : normalized
      const rating = Number.parseFloat(numericKey)

      if (!Number.isNaN(rating)) {
        parsed[rating] = (parsed[rating] ?? 0) + (Number.isFinite(value) ? Number(value) : 0)
      }
    }

    const stepCounts: Record<number, number> = {}
    for (const step of RATING_STEPS) {
      stepCounts[step] = parsed[step] ?? 0
    }

    const ratingData = RATING_STEPS.map((rating) => ({
      rating,
      count: stepCounts[rating] ?? 0,
    }))

    const total = ratingData.reduce((sum, item) => sum + item.count, 0)
    if (total === 0) return { averageRating: 0, totalReviews: 0 }

    const weightedSum = ratingData.reduce(
      (sum, item) => sum + item.rating * item.count,
      0,
    )

    return {
      averageRating: Math.round((weightedSum / total) * 10) / 10,
      totalReviews: total,
    }
  }, [ratingsQuery.data])

  // 최고 점수 장르 찾기
  const topGenre = useMemo(() => {
    const genres = genreStatsQuery.data ?? []
    if (genres.length === 0) return null

    const top = genres.reduce((max, current) =>
      current.score > max.score ? current : max
    , genres[0])

    const genreKey = normalizeGenreKey(top.genre)

    return {
      name: profileGenreLabels[genreKey] ?? genreLabels[genreKey] ?? top.genre,
      svg: PROFILE_GENRE_SVG[genreKey] ?? GENRE_SVG[genreKey],
    }
  }, [genreStatsQuery.data])

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (isError || !me) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>프로필을 불러오지 못했습니다.</Text>
        <Text style={styles.errorHint}>다시 한번 시도해주세요.</Text>
      </View>
    )
  }

  if (activeTab === 'activity') {
    return (
      <>
        <ProfileActivityContent
          activeTab={activeActivityTab}
          onChangeTab={setActiveActivityTab}
          currentUserId={me.userId}
          currentUserProfileImageUrl={me.profileImageUrl}
          currentUserNickName={me.nickName}
          bottomInset={insets.bottom}
          header={
            <>
              <Stack.Screen options={{ headerShown: false }} />
              <View style={{ paddingTop: insets.top }}>
                <ProfileTopBar
                  onPressSettings={() => router.push('/profile/settings')}
                  onPressProfileCard={() => setShowCardModal(true)}
                />
              </View>
              <ProfileUserSummary me={me} />
              <LevelProgress
                level={me.stage}
                nextTitle={me.nextStage}
                remainingPoints={me.remainingScore}
                progress={me.progressPercentage / 100}
                topGenre={me.topGenre}
                title={me.title}
                progressPercentage={me.progressPercentage}
              />
              <ProfilePreferenceTabs activeTab={activeTab} onChangeTab={setActiveTab} />
            </>
          }
        />
        <ProfileCardModal
          visible={showCardModal}
          onClose={() => setShowCardModal(false)}
          nickname={me.nickName}
          title={me.title}
          averageRating={averageRating}
          topGenreName={topGenre?.name ?? me.topGenre}
          reviewCount={totalReviews}
          topGenreIconSvg={topGenre?.svg}
          onSaveSuccess={() => {
            setShowSavedToast(true)
            setTimeout(() => setShowSavedToast(false), 1500)
          }}
        />
        {showSavedToast && (
          <Modal visible transparent animationType="none" statusBarTranslucent>
            <View style={[styles.toastContainer, { bottom: savedToastBottom }]} pointerEvents="none">
              <Image source={savedToast} style={styles.toastImage} contentFit="contain" />
            </View>
          </Modal>
        )}
        {showProfileEditToast && (
          <Modal visible transparent animationType="none" statusBarTranslucent>
            <View style={[styles.toastContainer, { bottom: profileEditToastBottom }]} pointerEvents="none">
              <Image source={profileEditToast} style={styles.toastImage} contentFit="contain" />
            </View>
          </Modal>
        )}
      </>
    )
  }

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ paddingTop: insets.top }}>
        <ProfileTopBar
          onPressSettings={() => router.push('/profile/settings')}
          onPressProfileCard={() => setShowCardModal(true)}
        />
      </View>

      <ProfileUserSummary me={me} />
      <LevelProgress
        level={me.stage}
        nextTitle={me.nextStage}
        remainingPoints={me.remainingScore}
        progress={me.progressPercentage / 100}
        topGenre={me.topGenre}
        title={me.title}
        progressPercentage={me.progressPercentage}
      />
      <ProfilePreferenceTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      <ProfilePreferenceSection />
      <ProfileRatingSection />
      <ProfilePreferGenreSection />
      <ProfileHashtagSection />
    </ScrollView>
    <ProfileCardModal
      visible={showCardModal}
      onClose={() => setShowCardModal(false)}
      nickname={me.nickName}
      title={me.title}
      averageRating={averageRating}
      topGenreName={topGenre?.name ?? me.topGenre}
      reviewCount={totalReviews}
      topGenreIconSvg={topGenre?.svg}
      onSaveSuccess={() => {
        setShowSavedToast(true)
        setTimeout(() => setShowSavedToast(false), 1500)
      }}
    />

    {/* 저장 완료 토스트 */}
    {showSavedToast && (
      <Modal visible transparent animationType="none" statusBarTranslucent>
        <View style={[styles.toastContainer, { bottom: savedToastBottom }]} pointerEvents="none">
          <Image source={savedToast} style={styles.toastImage} contentFit="contain" />
        </View>
      </Modal>
    )}
    {showProfileEditToast && (
      <Modal visible transparent animationType="none" statusBarTranslucent>
        <View style={[styles.toastContainer, { bottom: profileEditToastBottom }]} pointerEvents="none">
          <Image source={profileEditToast} style={styles.toastImage} contentFit="contain" />
        </View>
      </Modal>
    )}
    </>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: C.card,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: C.card,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    color: C.error,
  },
  errorHint: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: Gray[500],
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
