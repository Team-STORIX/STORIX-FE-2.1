import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { Gray, Magenta, Typography } from '../../../theme'
import { deleteFavoriteArtist, deleteFavoriteWork } from '../../favorite/api/toggleFavorite.api'
import type { FavoriteArtist, FavoriteWork } from '../types'
import { useProfileFavoriteArtists } from '../hooks/useProfileFavoriteArtists'
import { useProfileFavoriteWorks } from '../hooks/useProfileFavoriteWorks'
import { ProfileLikedWorkItem } from './ProfileLikedWorkItem'
import { ProfileLikedWriterItem } from './ProfileLikedWriterItem'
import { ProfileLikesEmptyState } from './ProfileLikesEmptyState'
import { ProfileLikesTabs, type ProfileLikesTab } from './ProfileLikesTabs'
import { ProfileLikesTopBar } from './ProfileLikesTopBar'

const TAB_VALUES: ProfileLikesTab[] = ['works', 'writers']

const isLikesTab = (value: string | string[] | undefined): value is ProfileLikesTab =>
  typeof value === 'string' && TAB_VALUES.includes(value as ProfileLikesTab)

export function ProfileLikesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ tab?: string }>()
  const initialTab: ProfileLikesTab = isLikesTab(params.tab) ? params.tab : 'works'
  const [activeTab, setActiveTab] = useState<ProfileLikesTab>(initialTab)
  const worksQuery = useProfileFavoriteWorks(activeTab === 'works')
  const writersQuery = useProfileFavoriteArtists(activeTab === 'writers')
  const [pendingWorkRemoved, setPendingWorkRemoved] = useState<Set<number>>(new Set())
  const [pendingArtistRemoved, setPendingArtistRemoved] = useState<Set<number>>(new Set())
  const pendingRef = useRef({
    pendingWorkRemoved,
    pendingArtistRemoved,
  })
  const prevTabRef = useRef<ProfileLikesTab>(activeTab)
  const commitWorksLockRef = useRef(false)
  const commitArtistsLockRef = useRef(false)

  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab)
    }
  }, [activeTab, initialTab])

  useEffect(() => {
    pendingRef.current = {
      pendingWorkRemoved,
      pendingArtistRemoved,
    }
  }, [pendingArtistRemoved, pendingWorkRemoved])

  const commitWorks = useCallback(async () => {
    if (commitWorksLockRef.current) return
    commitWorksLockRef.current = true

    try {
      const targets = Array.from(pendingRef.current.pendingWorkRemoved)
      if (targets.length === 0) return

      await Promise.allSettled(targets.map((worksId) => deleteFavoriteWork(worksId)))
      setPendingWorkRemoved(new Set())
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', 'favorite-works'] }),
        queryClient.invalidateQueries({ queryKey: ['profile', 'favorite-works-preview'] }),
      ])
    } finally {
      commitWorksLockRef.current = false
    }
  }, [queryClient])

  const commitArtists = useCallback(async () => {
    if (commitArtistsLockRef.current) return
    commitArtistsLockRef.current = true

    try {
      const targets = Array.from(pendingRef.current.pendingArtistRemoved)
      if (targets.length === 0) return

      await Promise.allSettled(targets.map((artistId) => deleteFavoriteArtist(artistId)))
      setPendingArtistRemoved(new Set())
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', 'favorite-artists'] }),
        queryClient.invalidateQueries({ queryKey: ['profile', 'favorite-artists-preview'] }),
      ])
    } finally {
      commitArtistsLockRef.current = false
    }
  }, [queryClient])

  useEffect(() => {
    const previousTab = prevTabRef.current
    if (previousTab === activeTab) return

    const commitPrevious = async () => {
      if (previousTab === 'works') {
        await commitWorks()
      } else {
        await commitArtists()
      }
      prevTabRef.current = activeTab
    }

    void commitPrevious()
  }, [activeTab, commitArtists, commitWorks])

  useEffect(() => {
    return () => {
      void commitWorks()
      void commitArtists()
    }
  }, [commitArtists, commitWorks])

  const works = useMemo(
    () =>
      (worksQuery.data?.pages.flatMap((page) => page.result.content) ?? []).filter(
        (item) => !pendingWorkRemoved.has(item.worksId),
      ),
    [pendingWorkRemoved, worksQuery.data?.pages],
  )
  const writers = useMemo(
    () =>
      (writersQuery.data?.pages.flatMap((page) => page.result.content) ?? []).filter(
        (item) => !pendingArtistRemoved.has(item.artistId),
      ),
    [pendingArtistRemoved, writersQuery.data?.pages],
  )

  const query = activeTab === 'works' ? worksQuery : writersQuery
  const data = activeTab === 'works' ? works : writers

  const handleBack = () => {
    if ('canGoBack' in router && router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)/profile')
  }

  const handleChangeTab = (tab: ProfileLikesTab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
  }

  const renderHeader = () => (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top }}>
        <ProfileLikesTopBar onBack={handleBack} />
      </View>
      <ProfileLikesTabs activeTab={activeTab} onChange={handleChangeTab} />
    </>
  )

  const renderFooter = () => {
    if (!query.hasNextPage && !query.isFetchingNextPage) {
      return <View style={{ height: insets.bottom + 24 }} />
    }

    return (
      <View style={styles.footer}>
        {query.isFetchingNextPage ? (
          <ActivityIndicator size="small" color={Magenta[300]} />
        ) : (
          <Pressable onPress={() => void query.fetchNextPage()}>
            <Text style={styles.footerText}>{'\ub354 \ubcf4\uae30'}</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <FlatList<FavoriteWork | FavoriteArtist>
      data={data}
      key={activeTab}
      style={styles.list}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        query.isLoading ? (
          <View style={styles.inlineState}>
            <Text style={styles.inlineStateText}>{'\ubd88\ub7ec\uc624\ub294 \uc911...'}</Text>
          </View>
        ) : query.isError ? (
          <View style={styles.inlineState}>
            <Text style={styles.inlineStateText}>
              {'\uad00\uc2ec \uc815\ubcf4\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc5b4\uc694.'}
            </Text>
          </View>
        ) : (
          <ProfileLikesEmptyState tab={activeTab} />
        )
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage()
        }
      }}
      renderItem={({ item }) =>
        activeTab === 'works' ? (
          <ProfileLikedWorkItem
            item={item as FavoriteWork}
            isFavorite={!pendingWorkRemoved.has((item as FavoriteWork).worksId)}
            onToggleFavorite={(worksId) => {
              setPendingWorkRemoved((current) => {
                const next = new Set(current)
                if (next.has(worksId)) {
                  next.delete(worksId)
                } else {
                  next.add(worksId)
                }
                return next
              })
            }}
          />
        ) : (
          <ProfileLikedWriterItem
            item={item as FavoriteArtist}
            isFavorite={!pendingArtistRemoved.has((item as FavoriteArtist).artistId)}
            onToggleFavorite={(artistId) => {
              setPendingArtistRemoved((current) => {
                const next = new Set(current)
                if (next.has(artistId)) {
                  next.delete(artistId)
                } else {
                  next.add(artistId)
                }
                return next
              })
            }}
          />
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  inlineState: {
    paddingTop: 148,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inlineStateText: {
    ...Typography.body1Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.body2Medium,
    color: Gray[400],
  },
})
