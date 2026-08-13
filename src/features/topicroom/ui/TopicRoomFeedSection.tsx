import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { WarningEmptyState } from "../../../components/common/WarningEmptyState";
import { C, Gray, Magenta } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import type { TopicRoomItem } from "../api/topicroom.schema";
import { useJoinTopicRoom } from "../hooks/useJoinTopicRoom";
import { useMyTopicRoomsAll } from "../hooks/useMyTopicRoomsAll";
import { usePopularTopicRooms } from "../hooks/usePopularTopicRooms";
import { isTopicRoomParticipationLimitError } from "../services/topicRoomLimit";
import { HotTopicRoomCard } from "./HotTopicRoomCard";
import { TopicRoomLimitModal } from "./TopicRoomLimitModal";
import { TopicRoomListItem } from "./TopicRoomListItem";

const PADDING_H = 16; // section title horizontal padding
const CAROUSEL_PAD = 16; // carousel horizontal padding (card start x)
const PAGE_GAP = 16; // gap between page columns (creates next-page peek)
const CARD_GAP = 12; // vertical gap between the 3 cards in a page
const CARDS_PER_PAGE = 3;
const HOT_PAGE_WIDTH = 336;

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function TopicRoomFeedSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Each page is one white card containing 3 topic-room rows. Keep the Figma
  // width on normal phones while still fitting narrower devices.
  const itemWidth = Math.max(
    0,
    Math.min(HOT_PAGE_WIDTH, width - CAROUSEL_PAD * 2),
  );
  const snapInterval = itemWidth + PAGE_GAP;

  const popularQuery = usePopularTopicRooms();
  const myQuery = useMyTopicRoomsAll();
  const joinMutation = useJoinTopicRoom();
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const joiningId = joinMutation.isPending ? joinMutation.variables : null;

  const handlePressExploreTopicRooms = () => {
    router.push({
      pathname: "/search",
      params: {
        tab: "topicroom",
      },
    });
  };

  const handleEnter = (item: TopicRoomItem) => {
    const navigate = () =>
      router.push({
        pathname: "/topicroom/[roomId]",
        params: {
          roomId: String(item.topicRoomId),
          topicRoomName: item.topicRoomName ?? "",
          worksName: item.worksName ?? "",
          worksType: item.worksType ?? "",
          activeUserNumber: String(item.activeUserNumber ?? ""),
          entrySource: "feed",
        },
      });
    if (item.isJoined) {
      navigate();
      return;
    }
    joinMutation.mutate(item.topicRoomId, {
      onSuccess: navigate,
      onError: (err) => {
        if (isTopicRoomParticipationLimitError(err)) {
          setLimitModalVisible(true);
        }
      },
    });
  };

  const popularPages = useMemo(
    () => chunk(popularQuery.data ?? [], CARDS_PER_PAGE),
    [popularQuery.data],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (snapInterval <= 0) return;
    setPageIndex(Math.round(e.nativeEvent.contentOffset.x / snapInterval));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>지금 핫한 토픽룸</Text>
      </View>

      {popularQuery.isLoading ? (
        <ActivityIndicator
          size="small"
          color={C.primary}
          style={styles.loader}
        />
      ) : popularQuery.isError ? (
        <Text style={styles.errorText}>토픽룸을 불러오지 못했어요.</Text>
      ) : popularPages.length === 0 ? (
        <WarningEmptyState
          description="지금 핫한 토픽룸이 없어요."
          iconSize={96}
        />
      ) : (
        <>
          <FlatList
            horizontal
            data={popularPages}
            keyExtractor={(_, i) => `popular_page_${i}`}
            renderItem={({ item: pageRooms, index: pageIdx }) => {
              const isLast = pageIdx === popularPages.length - 1;
              return (
                <View
                  style={[
                    styles.page,
                    { width: itemWidth, marginRight: isLast ? 0 : PAGE_GAP },
                  ]}
                >
                  {pageRooms.map((room, i) => (
                    <View key={room.topicRoomId}>
                      <HotTopicRoomCard
                        item={room}
                        rank={pageIdx * CARDS_PER_PAGE + i + 1}
                        isJoining={joiningId === room.topicRoomId}
                        onPress={() => handleEnter(room)}
                      />
                      {i < pageRooms.length - 1 ? (
                        <View style={styles.rowDivider} />
                      ) : null}
                    </View>
                  ))}
                </View>
              );
            }}
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapInterval}
            decelerationRate="fast"
            disableIntervalMomentum
            onMomentumScrollEnd={onMomentumEnd}
            contentContainerStyle={styles.pageList}
          />
          {popularPages.length > 1 ? (
            <View style={styles.dots}>
              {popularPages.map((_, i) => (
                <View
                  key={`dot_${i}`}
                  style={[styles.dot, i === pageIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}
        </>
      )}

      <View style={[styles.header, styles.headerSpaced]}>
        <Text style={styles.sectionTitle}>참여 중인 토픽룸</Text>
      </View>

      {myQuery.isLoading ? (
        <ActivityIndicator
          size="small"
          color={C.primary}
          style={styles.loader}
        />
      ) : myQuery.isError ? (
        <JoinedTopicRoomEmpty onPress={handlePressExploreTopicRooms} />
      ) : (myQuery.data?.length ?? 0) === 0 ? (
        <JoinedTopicRoomEmpty onPress={handlePressExploreTopicRooms} />
      ) : (
        <View style={styles.myList}>
          {(myQuery.data ?? []).map((room) => {
            const withJoined = { ...room, isJoined: true };
            return (
              <TopicRoomListItem
                key={room.topicRoomId}
                item={withJoined}
                onPress={() => handleEnter(withJoined)}
              />
            );
          })}
        </View>
      )}
      <TopicRoomLimitModal
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
      />
    </View>
  );
}

function JoinedTopicRoomEmpty({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.joinedEmpty}>
      <WarningEmptyState
        title="아직 참여 중인 토픽룸이 없어요"
        iconSize={120}
        style={styles.joinedEmptyState}
      />
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.joinedEmptyButton,
          pressed && styles.joinedEmptyButtonPressed,
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.joinedEmptyButtonText}>토픽룸 참여하러 가기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Gray[50],
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: PADDING_H,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerSpaced: {
    paddingTop: 32,
  },
  sectionTitle: {
    ...Typography.heading2,
    color: C.text,
  },
  loader: {
    alignSelf: "center",
    marginVertical: 24,
  },
  errorText: {
    ...Typography.body2Medium,
    color: C.error,
    paddingHorizontal: PADDING_H,
    textAlign: "center",
  },
  pageList: {
    paddingHorizontal: CAROUSEL_PAD,
  },
  page: {
    padding: 12,
    gap: CARD_GAP,
    backgroundColor: C.card,
    borderRadius: 8,
    elevation: 2,
  },
  rowDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -CARD_GAP / 2,
    height: 1,
    backgroundColor: Gray[100],
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Gray[300],
  },
  dotActive: {
    backgroundColor: C.primary,
    width: 20,
    height: 4,
  },

  myList: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  joinedEmpty: {
    alignItems: "center",
    paddingBottom: 8,
  },
  joinedEmptyState: {
    paddingBottom: 12,
  },
  joinedEmptyButton: {
    height: 36,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Magenta[100],
    backgroundColor: Magenta[20],
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  joinedEmptyButtonText: {
    ...Typography.caption1Semibold,
    color: Magenta[300],
  },
  joinedEmptyButtonPressed: {
    opacity: 0.75,
  },
});
