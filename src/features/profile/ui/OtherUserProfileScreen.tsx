import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Typography } from '../../../theme'
import { BottomNavBarView, type TabRouteName } from '../../navigation/ui/BottomNavBar'
import { LibraryEmptyState, LibraryWorksList, type LibraryUiWork } from '../../library/ui'
import {
  shouldMaskAdultContent,
  useAdultVerificationStore,
} from '../../../store/adultVerification.store'
import {
  useOtherUserFavoriteWorks,
  useOtherUserGenreStats,
  useOtherUserHashtags,
  useOtherUserLibrary,
  useOtherUserProfile,
  useOtherUserRatings,
} from '../hooks/useOtherUserProfile'
import { getOtherUserProfileError } from '../lib/otherUserProfileError'
import type { FavoriteWorkPreview } from '../types'
import { OtherUserProfileTabs, type OtherUserProfileTab } from './OtherUserProfileTabs'
import { OtherUserProfileTopBar } from './OtherUserProfileTopBar'
import { ProfileFavoriteWorksSectionView } from './ProfilePreferenceSection'
import { ProfileHashtagSectionView } from './ProfileHashtagSection'
import { ProfilePreferGenreSectionView } from './ProfilePreferGenreSection'
import { ProfileRatingSectionView } from './ProfileRatingSection'
import { ProfileUserSummary } from './ProfileUserSummary'

const lockIcon = require('../../../../assets/icons/profile/icon-lib-lock.png')

// BottomNavBarView is absolutely positioned, so content keeps this much clear.
const NAV_BAR_HEIGHT = 80

const TAB_HREF: Record<TabRouteName, string> = {
  index: '/(tabs)',
  feed: '/(tabs)/feed',
  library: '/(tabs)/library',
  profile: '/(tabs)/profile',
}

const ERROR_MESSAGES = {
  blocked: '차단한 사용자의 프로필은 볼 수 없어요.',
  unavailable: '탈퇴했거나 이용이 제한된 사용자예요.',
  generic: '프로필을 불러오지 못했습니다.',
} as const

type Props = {
  userId: number
}

export function OtherUserProfileScreen({ userId }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<OtherUserProfileTab>('analysis')

  const profileQuery = useOtherUserProfile(userId)
  const genreStatsQuery = useOtherUserGenreStats(userId)
  const ratingsQuery = useOtherUserRatings(userId)
  const hashtagsQuery = useOtherUserHashtags(userId)
  const favoriteWorksQuery = useOtherUserFavoriteWorks(userId)
  const libraryQuery = useOtherUserLibrary(userId)

  const errorKind = getOtherUserProfileError(profileQuery.error)
  const navBottom = insets.bottom + NAV_BAR_HEIGHT

  // The server answers my own id with 400; that is my profile tab, not an error.
  useEffect(() => {
    if (errorKind === 'self') router.replace('/(tabs)/profile')
  }, [errorKind, router])

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)/profile')
  }, [router])

  // Tabs live on the root (tabs) route below this screen; navigate pops back to it.
  const handlePressTab = useCallback(
    (routeName: TabRouteName) => {
      router.navigate(TAB_HREF[routeName] as never)
    },
    [router],
  )

  const favoriteWorks = useMemo<{ count: number; works: FavoriteWorkPreview[] }>(() => {
    const firstPage = favoriteWorksQuery.data?.pages[0]
    return {
      count: firstPage?.totalFavoriteWorksCount ?? 0,
      works: (firstPage?.result.content ?? []).map((work) => ({
        id: work.worksId,
        title: work.worksName,
        author: work.artistName,
        imageUrl: work.thumbnailUrl ?? null,
      })),
    }
  }, [favoriteWorksQuery.data?.pages])

  const libraryWorks = useMemo<LibraryUiWork[]>(
    () =>
      (libraryQuery.data?.pages.flatMap((page) => page.result.content) ?? []).map((item) => ({
        id: item.worksId,
        reviewId: item.reviewId,
        title: item.worksName ?? '',
        meta: [item.artistName ?? '', item.worksType ?? ''].filter(Boolean).join(' · '),
        thumb: item.thumbnailUrl ?? '',
        rating: Number(item.rating ?? 0),
        reviewCount: 1,
        isAdultOnly: item.isAdultOnly ?? false,
        isBlinded: item.isBlinded ?? undefined,
      })),
    [libraryQuery.data?.pages],
  )

  const isLibraryPublic = libraryQuery.data?.pages[0]?.isPublic ?? profileQuery.data?.isLibraryPublic ?? true
  const libraryCount = libraryQuery.data?.pages[0]?.totalReviewCount ?? libraryWorks.length

  const openFavoriteWorks = useCallback(() => {
    router.push(`/profile/user/${userId}/likes` as never)
  }, [router, userId])

  const openWork = useCallback(
    (item: LibraryUiWork) => {
      if (shouldMaskAdultContent(item)) {
        useAdultVerificationStore.getState().showPrompt('read')
        return
      }
      router.push(`/works/${item.id}` as const)
    },
    [router],
  )

  const renderTopBar = () => (
    <View style={{ paddingTop: insets.top }}>
      <OtherUserProfileTopBar onBack={goBack} />
    </View>
  )

  const renderNavBar = () => (
    <BottomNavBarView activeRouteName="profile" onPressTab={handlePressTab} />
  )

  const centeredMessage = (message: string) => (
    <View style={[styles.centered, { paddingBottom: navBottom }]}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )

  if (profileQuery.isLoading || errorKind === 'self') {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        {renderTopBar()}
        <View style={[styles.centered, { paddingBottom: navBottom }]}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
        {renderNavBar()}
      </View>
    )
  }

  const profile = profileQuery.data
  if (profileQuery.isError || !profile) {
    const message =
      errorKind === 'blocked' || errorKind === 'unavailable'
        ? ERROR_MESSAGES[errorKind]
        : ERROR_MESSAGES.generic
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        {renderTopBar()}
        {centeredMessage(message)}
        {renderNavBar()}
      </View>
    )
  }

  const header = (
    <>
      <ProfileUserSummary me={profile} editable={false} />
      <OtherUserProfileTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        libraryCount={isLibraryPublic && libraryQuery.data ? libraryCount : undefined}
      />
    </>
  )

  const renderLibrary = () => {
    if (libraryQuery.isLoading) {
      return (
        <View style={[styles.centered, { paddingBottom: navBottom }]}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      )
    }

    if (libraryQuery.isError) {
      return centeredMessage('서재를 불러오지 못했어요.')
    }

    if (!isLibraryPublic) {
      return (
        <View style={[styles.centered, { paddingBottom: navBottom }]}>
          <Image source={lockIcon} style={styles.lockIcon} contentFit="contain" />
          <Text style={styles.privateText}>비공개된 서재예요</Text>
        </View>
      )
    }

    if (libraryWorks.length === 0) {
      return (
        <View style={[styles.centered, { paddingBottom: navBottom }]}>
          <LibraryEmptyState title="아직 리뷰한 작품이 없어요." />
        </View>
      )
    }

    return (
      <LibraryWorksList
        data={libraryWorks}
        bottomInset={navBottom + 24}
        isFetchingNextPage={libraryQuery.isFetchingNextPage}
        onEndReached={() => {
          if (libraryQuery.hasNextPage && !libraryQuery.isFetchingNextPage) {
            void libraryQuery.fetchNextPage()
          }
        }}
        onPressItem={openWork}
      />
    )
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      {renderTopBar()}

      {activeTab === 'analysis' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: navBottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {header}
          <ProfileFavoriteWorksSectionView
            count={favoriteWorks.count}
            works={favoriteWorks.works}
            onPressMore={openFavoriteWorks}
            isOwnProfile={false}
          />
          <ProfileRatingSectionView
            ratings={ratingsQuery.data}
            isError={ratingsQuery.isError}
            isOwnProfile={false}
          />
          <ProfilePreferGenreSectionView genres={genreStatsQuery.data ?? []} />
          <ProfileHashtagSectionView hashtags={hashtagsQuery.data} isOwnProfile={false} />
        </ScrollView>
      ) : (
        <View style={styles.scroll}>
          {header}
          {renderLibrary()}
        </View>
      )}

      {renderNavBar()}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
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
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  lockIcon: {
    width: 100,
    height: 100,
  },
  privateText: {
    marginTop: 20,
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'center',
  },
})
