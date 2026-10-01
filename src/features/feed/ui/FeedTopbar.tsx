import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Typography } from "../../../theme/typography";

const searchIcon = require("../../../../assets/icons/common/search.svg");
const addTopicRoomIcon = require("../../../../assets/topicroom/icon-add-topicroom.svg");

export type FeedTab = "works" | "writers";

const TABS: { key: FeedTab; label: string }[] = [
  { key: "works", label: "관심 피드" },
  { key: "writers", label: "토픽룸" },
];

type FeedTopbarProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
  hasUnreadTopicRooms?: boolean;
  onPressSearch?: () => void;
  onPressAddTopicRoom?: () => void;
};

export function FeedTopbar({
  activeTab,
  onChange,
  hasUnreadTopicRooms = false,
  onPressSearch,
  onPressAddTopicRoom,
}: FeedTopbarProps) {
  const actions = [
    { icon: searchIcon, label: "토픽룸 검색", onPress: onPressSearch },
    { icon: addTopicRoomIcon, label: "토픽룸 만들기", onPress: onPressAddTopicRoom },
  ];

  return (
    <View style={styles.bar}>
      <View style={styles.tabs}>
        {TABS.map(({ key, label }) => (
          <Pressable key={key} onPress={() => onChange(key)} hitSlop={8}>
            <View style={styles.tabLabel}>
              <Text style={[styles.tab, activeTab === key ? styles.tabActive : styles.tabInactive]}>
                {label}
              </Text>
              {key === "writers" && hasUnreadTopicRooms ? (
                <View style={styles.unreadDot} accessibilityLabel="읽지 않은 토픽룸 메시지 있음" />
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>

      {activeTab === "writers" ? (
        <View style={styles.actions}>
          {actions.map(({ icon, label, onPress }) =>
            onPress ? (
              <Pressable
                key={label}
                onPress={onPress}
                hitSlop={8}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionPressed]}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Image source={icon} style={styles.actionIcon} contentFit="contain" />
              </Pressable>
            ) : null,
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.card,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  tabLabel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  tab: {
    ...Typography.heading1,
  },
  tabActive: {
    color: Gray[900],
  },
  tabInactive: {
    color: Gray[200],
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.error,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Gray[100],
    borderRadius: 1000,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  actionPressed: {
    opacity: 0.6,
  },
});
