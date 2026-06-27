import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import { formatTimeAgo } from "../../../lib/utils/formatTimeAgo";
import { formatTopicRoomSubtitle } from "../api/formatTopicRoomSubtitle";
import type { TopicRoomItem } from "../api/topicroom.schema";

type Props = {
  item: TopicRoomItem;
  onPress: () => void;
};

export function TopicRoomListItem({ item, onPress }: Props) {
  const subtitle = formatTopicRoomSubtitle(item.worksType, item.worksName);

  // Prefer the membership join time when the backend provides it; otherwise
  // fall back to lastChatTime (recent activity, not a join time). The shared
  // formatter returns "" for missing/invalid/future values, so we never render
  // "NaN일 전" and simply drop the time segment when there is nothing valid.
  const selectedField = item.joinedAt ? "joinedAt" : "lastChatTime";
  const timeSource = item.joinedAt ?? item.lastChatTime;
  const formattedValue = formatTimeAgo(timeSource);
  const memberCount = item.activeUserNumber ?? 0;
  const rightText = formattedValue
    ? `${memberCount}명 · ${formattedValue}`
    : `${memberCount}명`;

  if (__DEV__) {
    console.log("[TOPICROOM_DATE] joined-list-item", {
      roomId: item.topicRoomId,
      joinedAt: item.joinedAt ?? null,
      lastChatTime: item.lastChatTime ?? null,
      selectedField,
      formattedValue,
    });
  }
  const initial = (item.worksName || item.topicRoomName || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.thumbnailWrap}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailFallback]}>
            <Text style={styles.thumbnailFallbackText}>{initial}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={styles.rightText}>{rightText}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.topicRoomName}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: C.divider,
    borderBottomWidth: 1,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
  },
  thumbnailFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryLight,
  },
  thumbnailFallbackText: {
    ...Typography.body1Bold,
    color: C.primary,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  subtitle: {
    ...Typography.body1Medium,
    color: C.text,
    flex: 1,
    lineHeight: 20,
  },
  rightText: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    flexShrink: 1,
  },
  joinedChip: {
    borderRadius: Radius.full,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  joinedChipText: {
    ...Typography.caption2Extrabold,
    color: C.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
