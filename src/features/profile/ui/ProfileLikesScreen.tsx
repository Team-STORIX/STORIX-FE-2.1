import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { Gray, Magenta, Typography } from '../../../theme'
import { deleteFavoriteWork } from '../../favorite/api/toggleFavorite.api'
import type { FavoriteWork } from '../types'
import { useProfileFavoriteWorks } from '../hooks/useProfileFavoriteWorks'
import { ProfileLikedWorkItem } from './ProfileLikedWorkItem'
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
  const [pendingWorkRemoved, setPendingWorkRemoved] = useState<Set<number>>(new Set())
  const pendingRef = useRef({ pendingWorkRemoved })
  const prevTabRef = useRef<ProfileLikesTab>(activeTab)
  const commitWorksLockRef = useRef(false)

  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab)
    }
  }, [activeTab, initialTab])

  useEffect(() => {
    pendingRef.current = { pendingWorkRemoved }
  }, [pendingWorkRemoved])

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

  useEffect(() => {
    const previousTab = prevTabRef.current
    if (previousTab === activeTab) return

    const commitPrevious = async () => {
      if (previousTab === 'works') {
        await commitWorks()
      }
      prevTabRef.current = activeTab
    }

    void commitPrevious()
  }, [activeTab, commitWorks])

  useEffect(() => {
    return () => {
      void commitWorks()
    }
  }, [commitWorks])

  const works = useMemo(
    () =>
      (worksQuery.data?.pages.flatMap((page) => page.result.content) ?? []).filter(
        (item) => !pendingWorkRemoved.has(item.worksId),
      ),
    [pendingWorkRemoved, worksQuery.data?.pages],
  )

  const query = activeTab === 'works'
    ? worksQuery
    : { hasNextPage: false, isFetchingNextPage: false, fetchNextPage: async () => {}, isLoading: false, isError: false }
  const data: FavoriteWork[] = activeTab === 'works' ? works : []

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
            <Text style={styles.footerText}>{'더 보기'}</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <FlatList<FavoriteWork>
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
            <Text style={styles.inlineStateText}>{'불러오는 중...'}</Text>
          </View>
        ) : query.isError ? (
          <View style={styles.inlineState}>
            <Text style={styles.inlineStateText}>
              {'관심 정보를 불러오지 못했어요.'}
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
      renderItem={({ item }) => (
        <ProfileLikedWorkItem
          item={item}
          isFavorite={!pendingWorkRemoved.has(item.worksId)}
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
      )}
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
