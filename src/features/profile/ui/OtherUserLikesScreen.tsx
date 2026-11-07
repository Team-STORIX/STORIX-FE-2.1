import { useCallback, useMemo } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Magenta, Typography } from '../../../theme'
import type { FavoriteWork } from '../types'
import { useOtherUserFavoriteWorks } from '../hooks/useOtherUserProfile'
import { ProfileLikedWorkItem } from './ProfileLikedWorkItem'
import { ProfileLikesEmptyState } from './ProfileLikesEmptyState'
import { ProfileLikesTopBar } from './ProfileLikesTopBar'

type Props = {
  userId: number
}

/** Another user's full 관심 작품 list: read-only, no 편집 and no 찾아보기 button. */
export function OtherUserLikesScreen({ userId }: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const worksQuery = useOtherUserFavoriteWorks(userId)

  const works = useMemo<FavoriteWork[]>(
    () =>
      (worksQuery.data?.pages.flatMap((page) => page.result.content) ?? []).map((item) => ({
        ...item,
        // The other-user API carries no review state; the item only uses it for a label.
        isReviewed: false,
      })),
    [worksQuery.data?.pages],
  )

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(`/profile/user/${userId}` as never)
  }, [router, userId])

  const renderHeader = useCallback(
    () => (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ paddingTop: insets.top }}>
          <ProfileLikesTopBar onBack={handleBack} />
        </View>
      </>
    ),
    [handleBack, insets.top],
  )

  const renderFooter = () => {
    if (!worksQuery.isFetchingNextPage) {
      return <View style={{ height: insets.bottom + 24 }} />
    }
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Magenta[300]} />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <FlatList<FavoriteWork>
        data={works}
        style={styles.list}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => String(item.worksId)}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          worksQuery.isLoading ? (
            <View style={styles.inlineState}>
              <Text style={styles.inlineStateText}>{'불러오는 중...'}</Text>
            </View>
          ) : worksQuery.isError ? (
            <View style={styles.inlineState}>
              <Text style={styles.inlineStateText}>{'관심 작품을 불러오지 못했어요.'}</Text>
            </View>
          ) : (
            <ProfileLikesEmptyState tab="works" showFindButton={false} />
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
            isFavorite={false}
            showFavoriteButton={false}
            onToggleFavorite={() => {}}
          />
        )}
      />
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
})
