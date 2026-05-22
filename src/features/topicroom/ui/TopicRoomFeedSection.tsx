import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { WarningEmptyState } from "../../../components/common/WarningEmptyState";
import { C } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import type { TopicRoomItem } from "../api/topicroom.schema";
import { useJoinTopicRoom } from "../hooks/useJoinTopicRoom";
import { useMyTopicRoomsAll } from "../hooks/useMyTopicRoomsAll";
import { usePopularTopicRooms } from "../hooks/usePopularTopicRooms";
import { HotTopicRoomCard } from "./HotTopicRoomCard";
import { TopicRoomListItem } from "./TopicRoomListItem";

const PADDING_H = 16;
const CARD_GAP = 12;
const CARDS_PER_PAGE = 3;

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
  const pageWidth = Math.max(0, width - PADDING_H * 2);

  const popularQuery = usePopularTopicRooms();
  const myQuery = useMyTopicRoomsAll();
  const joinMutation = useJoinTopicRoom();
  const joiningId = joinMutation.isPending ? joinMutation.variables : null;

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
        },
      });
    if (item.isJoined) {
      navigate();
      return;
    }
    joinMutation.mutate(item.topicRoomId, { onSuccess: navigate });
  };

  const popularPages = useMemo(
    () => chunk(popularQuery.data ?? [], CARDS_PER_PAGE),
    [popularQuery.data],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    setPageIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>🔥 지금 핫한 토픽룸</Text>
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
            renderItem={({ item: pageRooms, index: pageIdx }) => (
              <View style={[styles.page, { width: pageWidth }]}>
                {pageRooms.map((room, i) => (
                  <HotTopicRoomCard
                    key={room.topicRoomId}
                    item={room}
                    rank={pageIdx * CARDS_PER_PAGE + i + 1}
                    isJoining={joiningId === room.topicRoomId}
                    onPress={() => handleEnter(room)}
                  />
                ))}
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            snapToInterval={pageWidth}
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
        <Text style={styles.sectionTitle}>😎 참여 중인 토픽룸</Text>
      </View>

      {myQuery.isLoading ? (
        <ActivityIndicator
          size="small"
          color={C.primary}
          style={styles.loader}
        />
      ) : myQuery.isError ? (
        <Text style={styles.errorText}>
          참여 중인 토픽룸을 불러오지 못했어요.
        </Text>
      ) : (myQuery.data?.length ?? 0) === 0 ? (
        <WarningEmptyState
          title="아직 참여 중인 토픽룸이 없어요"
          description="토픽룸 참여하러 가기"
          iconSize={120}
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: C.card,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: PADDING_H,
    paddingTop: 20,
    paddingBottom: 14,
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
    paddingHorizontal: 0,
  },
  page: {
    paddingHorizontal: PADDING_H,
    gap: CARD_GAP,
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: C.border,
  },
  dotActive: {
    backgroundColor: C.primary,
    width: 16,
  },

  myList: {
    paddingTop: 4,
    paddingBottom: 8,
  },
});
