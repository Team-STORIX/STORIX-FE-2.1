import { Image } from "expo-image";
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
import { C } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import { formatTopicRoomSubtitle } from "../api/formatTopicRoomSubtitle";
import type { TopicRoomItem } from "../api/topicroom.schema";
import { useJoinTopicRoom } from "../hooks/useJoinTopicRoom";
import { useMyTopicRoomsAll } from "../hooks/useMyTopicRoomsAll";
import { usePopularTopicRooms } from "../hooks/usePopularTopicRooms";
import { TopicRoomListItem } from "./TopicRoomListItem";

const fireIcon = require("../../../../assets/icons/common/fire.svg");
const peopleIcon = require("../../../../assets/icons/common/icon-topicroom-people.svg");

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
      router.push(`/topicroom/${item.topicRoomId}` as const);
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
            renderItem={({ item: pageRooms }) => (
              <View style={[styles.page, { width: pageWidth }]}>
                {pageRooms.map((room) => (
                  <PopularTopicRoomRow
                    key={room.topicRoomId}
                    item={room}
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

function PopularTopicRoomRow({
  item,
  isJoining,
  onPress,
}: {
  item: TopicRoomItem;
  isJoining: boolean;
  onPress: () => void;
}) {
  const subtitle = formatTopicRoomSubtitle(item.worksType, item.worksName);
  const initial = (item.worksName || item.topicRoomName || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      disabled={isJoining}
      style={({ pressed }) => [
        styles.popularCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.popularThumbWrap}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.popularThumb}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.popularThumb, styles.popularThumbFallback]}>
            <Text style={styles.popularThumbFallbackText}>{initial}</Text>
          </View>
        )}
      </View>

      <View style={styles.popularBody}>
        <Text style={styles.popularSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        <Text style={styles.popularTitle} numberOfLines={2}>
          {item.topicRoomName}
        </Text>
        <View style={styles.chipRow}>
          <View style={styles.hotChip}>
            <Image
              source={fireIcon}
              style={styles.icon12}
              contentFit="contain"
            />
            <Text style={styles.hotChipText}>HOT</Text>
          </View>
          <View style={styles.peopleChip}>
            <Image
              source={peopleIcon}
              style={styles.icon12}
              contentFit="contain"
            />
            <Text style={styles.peopleChipText}>
              {item.activeUserNumber ?? 0}
            </Text>
          </View>
        </View>
      </View>

      {isJoining ? (
        <ActivityIndicator
          size="small"
          color={C.primary}
          style={styles.joiningSpinner}
        />
      ) : null}
    </Pressable>
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

  popularCard: {
    flexDirection: "row",
    alignItems: "center",
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 14,
  },
  cardPressed: {
    opacity: 0.85,
  },
  popularThumbWrap: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    overflow: "hidden",
    flexShrink: 0,
  },
  popularThumb: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
  },
  popularThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryLight,
  },
  popularThumbFallbackText: {
    ...Typography.heading2,
    color: C.primary,
  },
  popularBody: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  popularSubtitle: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  popularTitle: {
    ...Typography.body1Bold,
    color: C.text,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  hotChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  hotChipText: {
    ...Typography.caption2Extrabold,
    color: C.card,
    marginLeft: 2,
  },
  peopleChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.full,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  peopleChipText: {
    ...Typography.caption2Extrabold,
    color: C.primary,
    marginLeft: 2,
  },
  icon12: {
    width: 12,
    height: 12,
  },
  joiningSpinner: {
    position: "absolute",
    right: 16,
    top: 16,
  },

  myList: {
    gap: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
});
