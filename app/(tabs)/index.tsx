import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  HashtagList,
  HomeHeader,
  HomeSection,
  HotFeedSlider,
  MyTasteCard,
  TopicRoomCoverCarousel,
  useTodayHomeFeeds,
} from '../../src/features/home'
import {
  PreferenceToast,
  isPreferenceDailyLimitError,
  usePreferenceExploration,
} from '../../src/features/preference'
import { useTodayTopicRooms } from '../../src/features/topicroom'
import { C } from '../../src/theme/colors'

const HOME_PAD = 16
const SECTION_GAP = 24

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    data: feeds,
    isLoading: feedsLoading,
  } = useTodayHomeFeeds()
  const {
    data: todayRooms,
    isLoading: todayLoading,
  } = useTodayTopicRooms()
  const {
    refetch: refetchExploration,
    isFetching: checkingExploration,
  } = usePreferenceExploration(false)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = (message: string) => {
    setToastMessage(message)

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 1500)
  }

  const handleMyTastePress = async () => {
    if (checkingExploration) return

    try {
      const result = await refetchExploration()

      if (result.isError) {
        showToast(
          isPreferenceDailyLimitError(result.error)
            ? '하루 한번만 가능합니다.'
            : '취향 분석 정보를 불러오지 못했어요.',
        )
        return
      }

      const items = result.data ?? []

      if (items.length === 0) {
        showToast('하루 한번만 가능합니다.')
        return
      }

      router.push('/home/preference' as never)
    } catch (error) {
      showToast(
        isPreferenceDailyLimitError(error)
          ? '하루 한번만 가능합니다.'
          : '취향 분석 정보를 불러오지 못했어요.',
      )
    }
  }

  const goSearchKeyword = (raw: string) => {
    const keyword = raw.replace(/^#/, '').trim()
    if (!keyword) return
    router.push(`/search?keyword=${encodeURIComponent(keyword)}` as never)
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: 128 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader onSearchPress={() => router.push('/search' as never)} />

        <View style={styles.stack}>
          <View>
            <HomeSection
              title="실시간 작품 이야기!"
              onArrowPress={() => router.push('/topicroom' as never)}
            >
              <TopicRoomCoverCarousel
                data={todayRooms}
                isLoading={todayLoading}
                badgeLabel="HOT"
                emptyText="오늘 참여중인 토픽룸이 아직 없어요"
                onPressItem={(room) =>
                  router.push(`/topicroom/${room.topicRoomId}` as const)
                }
              />
            </HomeSection>
          </View>

          <View>
            <HomeSection
              title="오늘의 피드"
              onArrowPress={() => router.push('/(tabs)/feed' as never)}
            >
              <HotFeedSlider
                data={feeds}
                isLoading={feedsLoading}
                onPressItem={(item) => {
                  const worksId =
                    item.board.isWorksSelected &&
                    item.board.worksId != null &&
                    item.board.worksId > 0
                      ? item.board.worksId
                      : null
                  if (worksId == null) return
                  router.push(`/works/${worksId}` as const)
                }}
              />
            </HomeSection>
          </View>

          <View>
            <HomeSection
              title="이 작품, 내 취향일까?"
              onArrowPress={() => void handleMyTastePress()}
            >
              <MyTasteCard onPress={() => void handleMyTastePress()} />
            </HomeSection>
          </View>

          <View style={styles.hashtagBlock}>
            <HashtagList onSelect={goSearchKeyword} />
          </View>
        </View>
      </ScrollView>

      <PreferenceToast
        message={toastMessage}
        position="bottom"
        bottomOffset={24}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: HOME_PAD,
  },
  stack: {
    gap: SECTION_GAP,
  },
  hashtagBlock: {
    marginBottom: 32,
  },
})
