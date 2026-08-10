import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import { formatTopicRoomSubtitle } from "../api/formatTopicRoomSubtitle";
import type { TopicRoomItem } from "../api/topicroom.schema";

type Props = {
  item: TopicRoomItem;
  onPress: () => void;
};

export function TopicRoomListItem({ item, onPress }: Props) {
  const subtitle = formatTopicRoomSubtitle(item.worksType, item.worksName);
  const memberCount = item.activeUserNumber ?? 0;
  const unreadCount = item.unreadCount ?? 0;
  const unreadLabel = unreadCount >= 100 ? "99+" : String(unreadCount);

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
          <Text style={styles.rightText}>{memberCount}명</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.topicRoomName}
          </Text>
          {unreadCount > 0 ? (
            <View
              style={styles.unreadBadge}
              accessibilityLabel={`읽지 않은 메시지 ${unreadCount}개`}
            >
              <Text style={styles.unreadBadgeText}>{unreadLabel}</Text>
            </View>
          ) : null}
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
    justifyContent: "space-between",
    gap: 8,
  },
  subtitle: {
    ...Typography.body1Medium,
    color: C.text,
    flex: 1,
    maxWidth: 240,
    lineHeight: 20,
  },
  rightText: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    marginLeft: "auto",
    textAlign: "right",
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 18,
    minHeight: 18,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.error,
    flexShrink: 0,
  },
  unreadBadgeText: {
    ...Typography.caption2Extrabold,
    color: C.card,
    textAlign: "center",
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
