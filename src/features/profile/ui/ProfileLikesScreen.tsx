import { useCallback, useMemo, useState } from 'react'
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
  const [isEditing, setIsEditing] = useState(false)
  const [selectedWorkIds, setSelectedWorkIds] = useState<Set<number>>(new Set())
  const [removedWorkIds, setRemovedWorkIds] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedCount = selectedWorkIds.size

  const works = useMemo(
    () =>
      (worksQuery.data?.pages.flatMap((page) => page.result.content) ?? []).filter(
        (item) => !removedWorkIds.has(item.worksId),
      ),
    [removedWorkIds, worksQuery.data?.pages],
  )

  const handleBack = useCallback(() => {
    if ('canGoBack' in router && router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)/profile')
  }, [router])

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      setSelectedWorkIds(new Set())
      setIsEditing(false)
      return
    }
    setIsEditing(true)
  }, [isEditing])

  const renderHeader = useCallback(() => (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top }}>
        <ProfileLikesTopBar
          onBack={handleBack}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
        />
      </View>
    </>
  ), [handleBack, handleToggleEdit, insets.top, isEditing])

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
    <View style={styles.screen}>
      <FlatList<FavoriteWork>
        data={works}
        style={styles.list}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + (isEditing ? 120 : 24),
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
          isFavorite={selectedWorkIds.has(item.worksId)}
          showFavoriteButton={isEditing}
          onToggleFavorite={(worksId) => {
            setSelectedWorkIds((current) => {
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
    {isEditing ? (
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          disabled={selectedCount === 0 || isDeleting}
          onPress={async () => {
            if (selectedCount === 0 || isDeleting) return
            const targets = Array.from(selectedWorkIds)
            setRemovedWorkIds((current) => {
              const next = new Set(current)
              targets.forEach((worksId) => next.add(worksId))
              return next
            })
            setSelectedWorkIds(new Set())
            setIsEditing(false)
            setIsDeleting(true)
            try {
              await Promise.allSettled(targets.map((worksId) => deleteFavoriteWork(worksId)))
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['profile', 'favorite-works'] }),
                queryClient.invalidateQueries({ queryKey: ['profile', 'favorite-works-preview'] }),
              ])
            } finally {
              setIsDeleting(false)
            }
          }}
          style={({ pressed }) => [
            styles.deleteButton,
            selectedCount > 0 ? styles.deleteButtonActive : styles.deleteButtonInactive,
            pressed && selectedCount > 0 && styles.deleteButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="선택 작품 삭제하기"
        >
          <Text
            style={[
              styles.deleteButtonText,
              selectedCount > 0 ? styles.deleteButtonTextActive : styles.deleteButtonTextInactive,
            ]}
          >
            선택 작품 삭제하기
          </Text>
        </Pressable>
      </View>
    ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
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
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: C.card,
  },
  deleteButton: {
    height: 49,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonInactive: {
    backgroundColor: Gray[200],
  },
  deleteButtonActive: {
    backgroundColor: Gray[900],
  },
  deleteButtonPressed: {
    opacity: 0.9,
  },
  deleteButtonText: {
    ...Typography.body1Medium,
  },
  deleteButtonTextInactive: {
    color: Gray[500],
  },
  deleteButtonTextActive: {
    color: C.card,
  },
})
