import { Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "../../../theme/colors";
import { Typography } from "../../../theme/typography";

export type SearchTab = "works" | "topicroom";

type Props = {
  activeTab: SearchTab;
  onChangeTab: (tab: SearchTab) => void;
};

const TAB_ITEMS: Array<{ key: SearchTab; label: string }> = [
  { key: "works", label: "작품" },
  { key: "topicroom", label: "토픽룸" },
];

export function SearchResultTabs({ activeTab, onChangeTab }: Props) {
  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((item) => {
        const active = item.key === activeTab;

        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.tabButton,
              active && styles.tabButtonActive,
              pressed && styles.pressed,
            ]}
            onPress={() => onChangeTab(item.key)}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderBottomWidth: 2,
    borderBottomColor: C.divider,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: -2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: C.text,
  },
  tabText: {
    ...Typography.body1Medium,
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
