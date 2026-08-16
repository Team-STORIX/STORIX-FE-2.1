import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HomeEventBanner,
  useAppEventBanners,
  type AppEventBanner,
} from "../../src/features/app-event";
import { getAppEventWebViewRoute } from "../../src/features/app-event/lib/targetNavigation";
import {
  HashtagList,
  HomeHeader,
  HomeSection,
  HotFeedSlider,
  MyTasteCard,
  TopicRoomCoverCarousel,
  useTodayHomeFeeds,
} from "../../src/features/home";
import { useNotificationConsentModal } from "../../src/features/notification/hooks/useNotificationConsentModal";
import { useUnreadNotificationCount } from "../../src/features/notification/hooks/useNotifications";
import { NotificationConsentModal } from "../../src/features/notification/ui/NotificationConsentModal";
import {
  isPreferenceDailyLimitError,
  PreferenceToast,
  usePreferenceExploration,
} from "../../src/features/preference";
import {
  getTopicRoomDiscoveryRoute,
  usePopularTopicRooms,
  useTodayTopicRooms,
  type TopicRoomItem,
} from "../../src/features/topicroom";
import {
  trackScreenView,
  trackSelectContent,
} from "../../src/lib/analytics/events";
import { C } from "../../src/theme/colors";

const HOME_PAD = 16;
const SECTION_GAP = 24;
const TAB_BAR_HEIGHT = 80;
// Plus button top sits 106px above the bottom; toast sits 8px above it.
const TOAST_ABOVE_PLUS_OFFSET = 114;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: feeds, isLoading: feedsLoading } = useTodayHomeFeeds();
  const { data: eventBanners, refetch: refetchEventBanners } =
    useAppEventBanners();
  const { data: todayRooms, isLoading: todayLoading } = useTodayTopicRooms();
  const { data: popularRooms, isLoading: popularLoading } =
    usePopularTopicRooms();
  const { refetch: refetchExploration, isFetching: checkingExploration } =
    usePreferenceExploration(false);
  const { data: unreadCount } = useUnreadNotificationCount();

  // One-time event/benefit consent overlay on first Home entry after onboarding.
  const consent = useNotificationConsentModal();

  const topicRooms = useMemo(() => {
    const today = todayRooms ?? [];
    if (today.length >= 3) return today;

    const todayIds = new Set(today.map((room) => room.topicRoomId));
    const fill = (popularRooms ?? [])
      .filter((room) => !todayIds.has(room.topicRoomId))
      .slice(0, 3 - today.length);

    return [...today, ...fill];
  }, [popularRooms, todayRooms]);

  const topicRoomsLoading =
    todayLoading || ((todayRooms?.length ?? 0) < 3 && popularLoading);

  useFocusEffect(
    useCallback(() => {
      void trackScreenView("home");
      void refetchEventBanners();
    }, [refetchEventBanners]),
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 1500);
  };

  const handleMyTastePress = async () => {
    if (checkingExploration) return;

    try {
      const result = await refetchExploration();

      if (result.isError) {
        showToast(
          isPreferenceDailyLimitError(result.error)
            ? "하루 한 번만 가능합니다."
            : "취향 분석 정보를 불러오지 못했어요.",
        );
        return;
      }

      const items = result.data ?? [];

      if (items.length === 0) {
        showToast("하루 한 번만 가능합니다.");
        return;
      }

      router.push("/home/preference" as never);
    } catch (error) {
      showToast(
        isPreferenceDailyLimitError(error)
          ? "하루 한 번만 가능합니다."
          : "취향 분석 정보를 불러오지 못했어요.",
      );
    }
  };

  const goSearchKeyword = (raw: string, index = 0) => {
    const keyword = raw.trim();
    if (!keyword) return;
    void trackSelectContent({
      source_section: "home_recommended_hashtag",
      content_type: "hashtag",
      content_id: `hashtag_${keyword.replace(/^#/, "").trim()}`,
      position: index + 1,
    });
    router.push(`/search?keyword=${encodeURIComponent(keyword)}` as never);
  };

  const goFeedSection = (section: "topicroom" | "works") => {
    router.push(
      `/(tabs)/feed?section=${section}&landingKey=${Date.now()}` as never,
    );
  };

  const enterTopicRoom = useCallback(
    async (room: TopicRoomItem, index = 0) => {
      void trackSelectContent({
        source_section: "home_today_topic_room",
        content_type: "topic_room",
        content_id: `topic_${room.topicRoomId}`,
        position: index + 1,
      });
      router.push(await getTopicRoomDiscoveryRoute(room.topicRoomId, room));
    },
    [router],
  );

  const openEventBanner = useCallback(
    (banner: AppEventBanner) => {
      const route = getAppEventWebViewRoute(
        banner.targetId,
        banner.bannerTitle,
      );
      if (route) router.push(route as never);
    },
    [router],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          onSearchPress={() => router.push("/search" as never)}
          onNotificationPress={() => router.push("/notifications" as never)}
          unreadCount={unreadCount ?? 0}
        />

        <HomeEventBanner
          banners={eventBanners}
          onPressBanner={openEventBanner}
        />

        <View style={styles.stack}>
          <View>
            {/* TODO: Upcoming TopicRoom UI redesign — Figma "STORIX 2.0 mid-fi > 소통(토픽룸) > 토픽룸 ver2" (node 8009:38269). */}
            <HomeSection
              title="실시간 작품 이야기!"
              onArrowPress={() => goFeedSection("topicroom")}
            >
              <TopicRoomCoverCarousel
                data={topicRooms}
                isLoading={topicRoomsLoading}
                badgeLabel="HOT"
                emptyText="오늘 참여중인 토픽룸이 아직 없어요"
                onPressItem={enterTopicRoom}
              />
            </HomeSection>
          </View>

          <View>
            <HomeSection
              title="오늘의 피드"
              onArrowPress={() => goFeedSection("works")}
            >
              <HotFeedSlider
                data={feeds}
                isLoading={feedsLoading}
                onPressItem={(item, index) => {
                  void trackSelectContent({
                    source_section: "home_today_feed",
                    content_type: "feed_post",
                    content_id: `post_${item.board.boardId}`,
                    position: index + 1,
                  });
                  router.push(
                    `/feed/${item.board.boardId}?from=todayFeed` as never,
                  );
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
        bottomOffset={TOAST_ABOVE_PLUS_OFFSET}
        onClose={() => setToastMessage(null)}
      />

      <NotificationConsentModal {...consent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.card,
  },
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  content: {
    paddingHorizontal: HOME_PAD,
  },
  stack: {
    gap: SECTION_GAP,
  },
  hashtagBlock: {
    marginBottom: 0,
  },
});
