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
import { useTodayTopicRooms } from '../../src/features/topicroom'
import { C } from '../../src/theme/colors'

const HOME_PAD = 16
const SECTION_GAP = 24

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const {
    data: feeds,
    isLoading: feedsLoading,
  } = useTodayHomeFeeds()
  const {
    data: todayRooms,
    isLoading: todayLoading,
  } = useTodayTopicRooms()

  const goSearchKeyword = (raw: string) => {
    const k = raw.replace(/^#/, '').trim()
    if (!k) return
    router.push(`/search?keyword=${encodeURIComponent(k)}` as never)
  }

  return (
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
              emptyText="오늘 참여할 토픽룸이 아직 없어요."
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
          <HomeSection title="이 작품, 내 취향일까?" withArrow={false}>
            <MyTasteCard />
          </HomeSection>
        </View>

        <View style={styles.hashtagBlock}>
          <HashtagList onSelect={goSearchKeyword} />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
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
