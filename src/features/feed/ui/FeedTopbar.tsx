import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gray } from "../../../theme/colors";

const searchIcon = require("../../../../assets/icons/common/search.svg");
const addTopicRoomIcon = require("../../../../assets/topicroom/icon-add-topicroom.svg");

export type FeedTab = "works" | "writers";

type FeedTopbarProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
  onPressSearch?: () => void;
  onPressAddTopicRoom?: () => void;
};

export function FeedTopbar({
  activeTab,
  onChange,
  onPressSearch,
  onPressAddTopicRoom,
}: FeedTopbarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.tabs}>
        <Pressable onPress={() => onChange("works")} hitSlop={8}>
          <Text
            style={[
              styles.tab,
              activeTab === "works" ? styles.tabActive : styles.tabInactive,
            ]}
          >
            관심 피드
          </Text>
        </Pressable>
        <Pressable onPress={() => onChange("writers")} hitSlop={8}>
          <Text
            style={[
              styles.tab,
              activeTab === "writers" ? styles.tabActive : styles.tabInactive,
            ]}
          >
            토픽룸
          </Text>
        </Pressable>
      </View>

      {activeTab === "writers" ? (
        <View style={styles.actions}>
          {onPressSearch ? (
            <Pressable
              onPress={onPressSearch}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.actionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="토픽룸 검색"
            >
              <Image
                source={searchIcon}
                style={styles.actionIcon}
                contentFit="contain"
              />
            </Pressable>
          ) : null}
          {onPressAddTopicRoom ? (
            <Pressable
              onPress={onPressAddTopicRoom}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.actionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="토픽룸 만들기"
            >
              <Image
                source={addTopicRoomIcon}
                style={styles.actionIcon}
                contentFit="contain"
              />
            </Pressable>
          ) : null}
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
    backgroundColor: "#ffffff",
  },
  tabs: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  tab: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 34,
  },
  tabActive: {
    color: Gray[900],
  },
  tabInactive: {
    color: Gray[200],
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
