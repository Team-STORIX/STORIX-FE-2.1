import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { deleteFavoriteWork } from '../../favorite/api/toggleFavorite.api'
import type { FavoriteWork } from '../types'
import { useProfileFavoriteWorks } from '../hooks/useProfileFavoriteWorks'
import { ProfileLikedWorkItem } from './ProfileLikedWorkItem'
import { ProfileLikesEmptyState } from './ProfileLikesEmptyState'
import { ProfileLikesTopBar } from './ProfileLikesTopBar'

export function ProfileLikesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const worksQuery = useProfileFavoriteWorks(true)
  const [pendingWorkRemoved, setPendingWorkRemoved] = useState<Set<number>>(new Set())
  const pendingRef = useRef({ pendingWorkRemoved })
  const commitWorksLockRef = useRef(false)

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

  const handleBack = () => {
    if ('canGoBack' in router && router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)/profile')
  }

  const renderHeader = () => (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top }}>
        <ProfileLikesTopBar onBack={handleBack} />
      </View>
    </>
  )

  const renderFooter = () => {
    if (!worksQuery.hasNextPage && !worksQuery.isFetchingNextPage) {
      return <View style={{ height: insets.bottom + 24 }} />
    }

    return (
      <View style={styles.footer}>
        {worksQuery.isFetchingNextPage ? (
          <ActivityIndicator size="small" color={Magenta[300]} />
        ) : (
          <Pressable onPress={() => void worksQuery.fetchNextPage()}>
            <Text style={styles.footerText}>{'더 보기'}</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <FlatList<FavoriteWork>
      data={works}
      style={styles.list}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        worksQuery.isLoading ? (
          <View style={styles.inlineState}>
            <Text style={styles.inlineStateText}>{'불러오는 중...'}</Text>
          </View>
        ) : worksQuery.isError ? (
          <View style={styles.inlineState}>
            <Text style={styles.inlineStateText}>
              {'관심 작품을 불러오지 못했어요.'}
            </Text>
          </View>
        ) : (
          <ProfileLikesEmptyState tab="works" />
        )
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (worksQuery.hasNextPage && !worksQuery.isFetchingNextPage) {
          void worksQuery.fetchNextPage()
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
    backgroundColor: C.card,
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
