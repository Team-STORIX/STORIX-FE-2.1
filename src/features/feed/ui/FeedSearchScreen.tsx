import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Keyboard, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  useDeleteAllFeedRecentKeywords,
  useDeleteFeedRecentKeyword,
  useFeedRecentKeywords,
  useSearchBoards,
} from '../hooks/feed'
import { C, Magenta } from '../../../theme'
import { LibraryEmptyState } from '../../library/ui/LibraryEmptyState'
import { LibrarySearchHeader } from '../../library/ui/LibrarySearchHeader'
import { SearchRecentKeywordsSection } from '../../search/ui/SearchRecentKeywordsSection'
import { useFeedBoardList } from './useFeedBoardList'

const SEARCH_PATH = '/feed/search'

function normalizeKeyword(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  return (value ?? '').trim()
}

export function FeedSearchScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{ keyword?: string }>()

  const submittedKeyword = normalizeKeyword(params.keyword)
  const [inputValue, setInputValue] = useState(submittedKeyword)

  const recentKeywordsQuery = useFeedRecentKeywords()
  const deleteRecentKeyword = useDeleteFeedRecentKeyword()
  const deleteAllRecentKeywords = useDeleteAllFeedRecentKeywords()
  const searchQuery = useSearchBoards(submittedKeyword)
  const { renderItem, modals } = useFeedBoardList()

  const items = searchQuery.data?.pages.flatMap((page) => page.content) ?? []

  useEffect(() => {
    setInputValue(submittedKeyword)
  }, [submittedKeyword])

  const submitKeyword = (raw: string) => {
    const keyword = normalizeKeyword(raw)
    Keyboard.dismiss()
    setInputValue(keyword)
    router.replace(
      (keyword ? `${SEARCH_PATH}?keyword=${encodeURIComponent(keyword)}` : SEARCH_PATH) as never,
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
      <LibrarySearchHeader
        value={inputValue}
        onChangeText={setInputValue}
        onSubmit={() => submitKeyword(inputValue)}
        onBackPress={() => router.back()}
        autoFocus={!submittedKeyword}
        placeholder="찾고 싶은 피드 게시글을 검색해 보세요"
        onClearPress={() => {
          setInputValue('')
          if (submittedKeyword) router.replace(SEARCH_PATH as never)
        }}
      />

      {!submittedKeyword ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.recentContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SearchRecentKeywordsSection
            items={recentKeywordsQuery.data?.recentKeywords ?? []}
            onPressKeyword={submitKeyword}
            onRemoveKeyword={(keyword) => deleteRecentKeyword.mutate(keyword)}
            onRemoveAll={() => deleteAllRecentKeywords.mutate()}
          />
        </ScrollView>
      ) : searchQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Magenta[300]} />
        </View>
      ) : searchQuery.isError ? (
        <LibraryEmptyState title="검색에 실패했어요." />
      ) : items.length === 0 ? (
        <LibraryEmptyState title="검색 결과가 없어요" />
      ) : (
        <FlatList
          style={styles.fill}
          data={items}
          keyExtractor={(item) => `board_${item.board.boardId}`}
          renderItem={renderItem}
          ListHeaderComponent={<View style={styles.listHeader} />}
          ListFooterComponent={
            <View style={{ paddingBottom: insets.bottom + 24 }}>
              {searchQuery.isFetchingNextPage ? (
                <ActivityIndicator size="small" color={Magenta[300]} style={styles.footerLoader} />
              ) : null}
            </View>
          }
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
              void searchQuery.fetchNextPage()
            }
          }}
          onEndReachedThreshold={0.4}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      )}

      {modals}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  fill: {
    flex: 1,
  },
  recentContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    height: 16,
  },
  footerLoader: {
    paddingVertical: 16,
  },
})
