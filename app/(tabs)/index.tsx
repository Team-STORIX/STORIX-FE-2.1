import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useMe } from '../../src/features/profile'
import { useTodayHomeFeeds } from '../../src/features/home'
import { usePopularTopicRooms, useTodayTopicRooms } from '../../src/features/topicroom'
import { HomeHeader } from '../../src/components/home/HomeHeader'
import { HomeSection } from '../../src/components/home/HomeSection'
import { HotFeedSlider } from '../../src/components/home/HotFeedSlider'
import { MyTasteCard } from '../../src/components/home/MyTasteCard'
import { TopicRoomCoverCarousel } from '../../src/components/home/TopicRoomCoverCarousel'
import { C } from '../../src/theme/colors'
import { Radius } from '../../src/theme/radius'
import { S } from '../../src/theme/spacing'
import { Typography } from '../../src/theme/typography'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { data: me, isLoading: meLoading } = useMe()
  const {
    data: feeds,
    isLoading: feedsLoading,
    isError: feedsError,
  } = useTodayHomeFeeds()
  const {
    data: todayRooms,
    isLoading: todayLoading,
    isError: todayError,
  } = useTodayTopicRooms()
  const {
    data: popularRooms,
    isLoading: popularLoading,
    isError: popularError,
  } = usePopularTopicRooms()

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 4 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader nickName={me?.nickName} isLoading={meLoading} />

      <View style={styles.sectionStack}>
        <HomeSection title="실시간 작품 이야기!">
          {todayError ? (
            <SectionMessage text="오늘의 토픽룸을 불러오지 못했어요." />
          ) : (
            <TopicRoomCoverCarousel
              data={todayRooms}
              isLoading={todayLoading}
              badgeLabel="HOT"
              emptyText="오늘 참여할 토픽룸이 아직 없어요."
              onPressItem={(room) =>
                router.push(`/topicroom/${room.topicRoomId}` as const)
              }
            />
          )}
        </HomeSection>

        <HomeSection title="오늘의 피드">
          {feedsError ? (
            <SectionMessage text="오늘의 피드를 불러오지 못했어요." />
          ) : (
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

                if (worksId == null) {
                  return
                }

                router.push(`/works/${worksId}` as const)
              }}
            />
          )}
        </HomeSection>

        <HomeSection title="인기 토픽룸">
          {popularError ? (
            <SectionMessage text="인기 토픽룸을 불러오지 못했어요." />
          ) : (
            <TopicRoomCoverCarousel
              data={popularRooms}
              isLoading={popularLoading}
              badgeLabel="LIVE"
              emptyText="지금 인기 있는 토픽룸이 아직 없어요."
              onPressItem={(room) =>
                router.push(`/topicroom/${room.topicRoomId}` as const)
              }
            />
          )}
        </HomeSection>

        <HomeSection title="이 작품, 내 취향일까?" withArrow={false}>
          <MyTasteCard />
        </HomeSection>
      </View>
    </ScrollView>
  )
}

function SectionMessage({ text }: { text: string }) {
  return (
    <View style={styles.messageCard}>
      <View style={styles.messageDot} />
      <Text style={styles.messageText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  sectionStack: {
    gap: 24,
    paddingTop: 8,
  },
  messageCard: {
    marginHorizontal: S.screenH,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    marginRight: 10,
  },
  messageText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    flex: 1,
  },
})
