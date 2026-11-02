import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme'
import { useMe } from '../hooks'
import { useProfileRatings } from '../hooks/useProfileRatings'
import { getProfileRatingStats } from '../lib/ratingStats'
import { useProfileGenreStats } from '../hooks/useProfileGenreStats'
import { ProfileActivityContent } from './ProfileActivityContent'
import { ProfileHashtagSection } from './ProfileHashtagSection'
import {
  GENRE_SVG,
  ProfilePreferGenreSection,
  genreLabels,
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
import {
  trackScreenView,
  trackViewProfileSection,
} from '../../../lib/analytics/events'

const savedToast = require('../../../../assets/common/cardshare/image-gallery-saved.svg')
const profileEditToast = require('../../../../assets/common/cardshare/profile-fix-toast.svg')
const PROFILE_TAB_BAR_HEIGHT = 80
const PROFILE_CARD_TOAST_NAV_GAP = 36
const PROFILE_EDIT_TOAST_BOTTOM = 36

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
  const viewedProfileSectionsRef = useRef(new Set<string>())
  const savedToastBottom =
    insets.bottom + PROFILE_TAB_BAR_HEIGHT + PROFILE_CARD_TOAST_NAV_GAP
  const profileEditToastBottom = insets.bottom + PROFILE_EDIT_TOAST_BOTTOM

  const ratingsQuery = useProfileRatings()
  const genreStatsQuery = useProfileGenreStats()

  useFocusEffect(
    useCallback(() => {
      void trackScreenView('profile')
    }, []),
  )

  useEffect(() => {
    const sectionName = activeTab === 'activity' ? 'activity' : 'taste_analysis'
    if (viewedProfileSectionsRef.current.has(sectionName)) return

    viewedProfileSectionsRef.current.add(sectionName)
    void trackViewProfileSection({ section_name: sectionName })
  }, [activeTab])

  useEffect(() => {
    const toastKey = params.profileEditToast
    if (!toastKey || lastProfileEditToastRef.current === toastKey) return

    lastProfileEditToastRef.current = toastKey
    setShowProfileEditToast(true)
    const timer = setTimeout(() => setShowProfileEditToast(false), 1500)
    return () => clearTimeout(timer)
  }, [params.profileEditToast])

  const { averageRating, totalReviews } = useMemo(
    () => getProfileRatingStats(ratingsQuery.data),
    [ratingsQuery.data],
  )

  // 최고 점수 장르 찾기
  const topGenre = useMemo(() => {
    const genres = genreStatsQuery.data ?? []
    if (genres.length === 0) return null

    const top = genres.reduce((max, current) =>
      current.score > max.score ? current : max
    , genres[0])

    const genreKey = normalizeGenreKey(top.genre)

    return {
      name: genreLabels[genreKey] ?? top.genre,
      svg: GENRE_SVG[genreKey],
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

  const header = (
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
  )

  return (
    <>
      {activeTab === 'activity' ? (
        <ProfileActivityContent
          activeTab={activeActivityTab}
          onChangeTab={setActiveActivityTab}
          currentUserId={me.userId}
          currentUserProfileImageUrl={me.profileImageUrl}
          currentUserNickName={me.nickName}
          currentUserRole={me.role}
          bottomInset={insets.bottom}
          header={header}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {header}
          <ProfilePreferenceSection />
          <ProfileRatingSection />
          <ProfilePreferGenreSection />
          <ProfileHashtagSection />
        </ScrollView>
      )}
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
