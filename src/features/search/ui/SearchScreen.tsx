import { useEffect, useMemo, useState } from 'react'
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C } from '../../../theme/colors'
import {
  SEARCH_GENRE_VALUES,
  TOPIC_ROOM_SORT_VALUES,
  WORKS_TYPE_VALUES,
  type SearchGenre,
  type SearchWorksType,
  type TopicRoomSearchItem,
  type TopicRoomSort,
  type WorksSearchItem,
  type WorksSort,
} from '../api'
import {
  useDeleteAllRecentKeywords,
  useDeleteRecentKeyword,
  useRecentKeywords,
  useTopicRoomSearchInfinite,
  useTrendingKeywords,
  useWorksSearchInfinite,
} from '../hooks'
import { useJoinTopicRoom } from '../../topicroom'
import { useRecommendedHashtags } from '../../feed/hooks/hashtag'
import { SearchFilterChip } from './SearchFilterChip'
import { SearchFloatingButton } from './SearchFloatingButton'
import { SearchHeader } from './SearchHeader'
import { SearchOptionSheet } from './SearchOptionSheet'
import { SearchRecentKeywordsSection } from './SearchRecentKeywordsSection'
import { SearchResultTabs, type SearchTab } from './SearchResultTabs'
import { SearchTopicRoomResultList } from './SearchTopicRoomResultList'
import { SearchTrendingKeywordsSection } from './SearchTrendingKeywordsSection'
import { SearchWorksResultList } from './SearchWorksResultList'

const WORKS_SORT_LABELS: Record<WorksSort, string> = {
  NAME: '기본순',
  RATING: '별점순',
  REVIEW: '리뷰순',
}

const TOPIC_ROOM_SORT_LABELS: Record<TopicRoomSort, string> = {
  DEFAULT: '기본순',
  LATEST: '최신순',
  ACTIVE: '참여순',
}

const WORKS_TYPE_LABELS: Record<SearchWorksType, string> = {
  WEBTOON: '웹툰',
  WEBNOVEL: '웹소설',
  COMIC: '만화',
}

const GENRE_LABELS: Record<SearchGenre, string> = {
  ROMANCE: '로맨스',
  FANTASY: '판타지',
  DAILY: '일상',
  ROFAN: '로판',
  HISTORICAL: '역사',
  DRAMA: '드라마',
  GAG: '개그',
  THRILLER: '스릴러',
  ACTION: '액션',
  SPORTS: '스포츠',
  SENTIMENTAL: '감성',
  BL: 'BL',
  MODERN_FANTASY: '현판',
}

function normalizeKeyword(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  return (value ?? '').replace(/^#/, '').trim()
}

function summarizeSelected(
  values: string[],
  fallback: string,
  labels: Record<string, string>,
) {
  if (values.length === 0) return fallback
  const first = labels[values[0]] ?? values[0]
  if (values.length === 1) return first
  return `${first} 외 ${values.length - 1}`
}

function buildSearchHref(keyword: string) {
  return `/search?keyword=${encodeURIComponent(keyword)}`
}

export function SearchScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{ keyword?: string; tab?: string }>()

  const submittedKeyword = normalizeKeyword(params.keyword)
  const [inputValue, setInputValue] = useState(submittedKeyword)
  const [activeTab, setActiveTab] = useState<SearchTab>(() =>
    params.tab === 'topicroom' ? 'topicroom' : 'works',
  )
  const [worksSort, setWorksSort] = useState<WorksSort>('NAME')
  const [topicRoomSort, setTopicRoomSort] = useState<TopicRoomSort>('DEFAULT')
  const [selectedTypes, setSelectedTypes] = useState<SearchWorksType[]>([])
  const [selectedGenres, setSelectedGenres] = useState<SearchGenre[]>([])
  const [activeSheet, setActiveSheet] = useState<'sort' | 'type' | 'genre' | null>(null)

  const recentKeywordsQuery = useRecentKeywords()
  const trendingKeywordsQuery = useTrendingKeywords()
  const recommendedHashtagsQuery = useRecommendedHashtags()
  const deleteRecentKeywordMutation = useDeleteRecentKeyword()
  const deleteAllRecentKeywordsMutation = useDeleteAllRecentKeywords()

  const worksQuery = useWorksSearchInfinite(
    submittedKeyword,
    worksSort,
    selectedTypes,
    selectedGenres,
  )
  const topicRoomQuery = useTopicRoomSearchInfinite(
    submittedKeyword,
    topicRoomSort,
    selectedTypes,
    selectedGenres,
  )
  const joinTopicRoomMutation = useJoinTopicRoom()

  useEffect(() => {
    setInputValue(submittedKeyword)
  }, [submittedKeyword])

  useEffect(() => {
    setSelectedTypes([])
    setSelectedGenres([])
  }, [submittedKeyword])

  const recentKeywords = recentKeywordsQuery.data?.result.recentKeywords ?? []
  const trendingKeywords = trendingKeywordsQuery.data?.result.trendingKeywords ?? []
  const recommendationKeyword =
    recommendedHashtagsQuery.data?.find((item) => item.name.trim().length > 0)
      ?.name ?? trendingKeywords.find((item) => item.keyword.trim().length > 0)?.keyword ?? null

  const sortLabel =
    activeTab === 'works'
      ? WORKS_SORT_LABELS[worksSort]
      : TOPIC_ROOM_SORT_LABELS[topicRoomSort]
  const typeLabel = summarizeSelected(selectedTypes, '작품유형', WORKS_TYPE_LABELS)
  const genreLabel = summarizeSelected(selectedGenres, '장르', GENRE_LABELS)

  const worksSortOptions = useMemo(
    () =>
      (['NAME', 'RATING', 'REVIEW'] as WorksSort[]).map((value) => ({
        value,
        label: WORKS_SORT_LABELS[value],
      })),
    [],
  )

  const topicRoomSortOptions = useMemo(
    () =>
      TOPIC_ROOM_SORT_VALUES.map((value) => ({
        value,
        label: TOPIC_ROOM_SORT_LABELS[value],
      })),
    [],
  )

  const worksTypeOptions = useMemo(
    () =>
      WORKS_TYPE_VALUES.map((value) => ({
        value,
        label: WORKS_TYPE_LABELS[value],
      })),
    [],
  )

  const genreOptions = useMemo(
    () =>
      SEARCH_GENRE_VALUES.map((value) => ({
        value,
        label: GENRE_LABELS[value],
      })),
    [],
  )

  const submitKeyword = (raw: string) => {
    const keyword = normalizeKeyword(raw)
    Keyboard.dismiss()

    if (!keyword) {
      setActiveTab('works')
      setInputValue('')
      router.replace('/search' as never)
      void recentKeywordsQuery.refetch()
      return
    }

    setActiveTab('works')
    setInputValue(keyword)
    router.replace(buildSearchHref(keyword) as never)
  }

  const handlePressWorks = (item: WorksSearchItem) => {
    router.push(`/works/${item.worksId}` as const)
  }

  const handlePressTopicRoom = async (item: TopicRoomSearchItem) => {
    if (joinTopicRoomMutation.isPending) return

    if (!item.isJoined) {
      await joinTopicRoomMutation.mutateAsync(item.topicRoomId)
    }

    router.push(`/topicroom/${item.topicRoomId}` as const)
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
      <SearchHeader
        value={inputValue}
        onChangeText={setInputValue}
        onSubmit={() => submitKeyword(inputValue)}
        onBackPress={() => router.back()}
        showCancelIcon={
          submittedKeyword.length > 0 && normalizeKeyword(inputValue) === submittedKeyword
        }
      />

      {submittedKeyword ? (
        <View style={styles.resultsWrap}>
          <SearchResultTabs
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab)
            }}
          />

          <View style={styles.filtersWrap}>
            <SearchFilterChip
              label={sortLabel}
              selected={
                activeTab === 'works'
                  ? worksSort !== 'NAME'
                  : topicRoomSort !== 'DEFAULT'
              }
              onPress={() => setActiveSheet('sort')}
            />
            <SearchFilterChip
              label={typeLabel}
              selected={selectedTypes.length > 0}
              onPress={() => setActiveSheet('type')}
            />
            <SearchFilterChip
              label={genreLabel}
              selected={selectedGenres.length > 0}
              onPress={() => setActiveSheet('genre')}
            />
          </View>

          <View style={styles.listWrap}>
            {activeTab === 'works' ? (
              <>
                <SearchWorksResultList
                  data={worksQuery.items}
                  isLoading={worksQuery.isLoading}
                  isError={worksQuery.isError}
                  isFetchingNextPage={worksQuery.isFetchingNextPage}
                  hasNextPage={!!worksQuery.hasNextPage}
                  onEndReached={() => {
                    if (worksQuery.hasNextPage) {
                      void worksQuery.fetchNextPage()
                    }
                  }}
                  onPressItem={handlePressWorks}
                  recommendationKeyword={recommendationKeyword}
                  onPressRecommendation={submitKeyword}
                />
                {!worksQuery.isLoading && !worksQuery.isError ? (
                  <SearchFloatingButton />
                ) : null}
              </>
            ) : (
              <SearchTopicRoomResultList
                data={topicRoomQuery.items}
                isLoading={topicRoomQuery.isLoading}
                isError={topicRoomQuery.isError}
                isJoining={joinTopicRoomMutation.isPending}
                isFetchingNextPage={topicRoomQuery.isFetchingNextPage}
                hasNextPage={!!topicRoomQuery.hasNextPage}
                onEndReached={() => {
                  if (topicRoomQuery.hasNextPage) {
                    void topicRoomQuery.fetchNextPage()
                  }
                }}
                onPressItem={handlePressTopicRoom}
                recommendationKeyword={recommendationKeyword}
                onPressRecommendation={submitKeyword}
              />
            )}
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.homeScroll}
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SearchRecentKeywordsSection
            items={recentKeywords}
            onPressKeyword={(keyword) => submitKeyword(keyword)}
            onRemoveKeyword={(keyword) => {
              deleteRecentKeywordMutation.mutate(keyword)
            }}
            onRemoveAll={() => {
              deleteAllRecentKeywordsMutation.mutate()
            }}
          />

          <SearchTrendingKeywordsSection
            items={trendingKeywords}
            isLoading={trendingKeywordsQuery.isLoading}
            isError={trendingKeywordsQuery.isError}
            onPressKeyword={(keyword) => submitKeyword(keyword)}
          />
        </ScrollView>
      )}

      <SearchOptionSheet
        visible={activeSheet === 'sort'}
        title="정렬"
        options={activeTab === 'works' ? worksSortOptions : topicRoomSortOptions}
        value={[activeTab === 'works' ? worksSort : topicRoomSort]}
        onClose={() => setActiveSheet(null)}
        onApply={(value) => {
          if (activeTab === 'works') {
            setWorksSort((value[0] as WorksSort | undefined) ?? 'NAME')
            return
          }

          setTopicRoomSort((value[0] as TopicRoomSort | undefined) ?? 'DEFAULT')
        }}
      />

      <SearchOptionSheet
        visible={activeSheet === 'type'}
        title="작품유형"
        options={worksTypeOptions}
        value={selectedTypes}
        multiple
        onClose={() => setActiveSheet(null)}
        onApply={(value) => {
          setSelectedTypes(value as SearchWorksType[])
        }}
      />

      <SearchOptionSheet
        visible={activeSheet === 'genre'}
        title="장르"
        options={genreOptions}
        value={selectedGenres}
        multiple
        onClose={() => setActiveSheet(null)}
        onApply={(value) => {
          setSelectedGenres(value as SearchGenre[])
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  homeScroll: {
    flex: 1,
  },
  homeContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  resultsWrap: {
    flex: 1,
  },
  filtersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: C.card,
  },
  listWrap: {
    flex: 1,
  },
})
