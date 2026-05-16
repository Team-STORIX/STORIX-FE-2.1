import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import { SearchWarningIcon } from "./SearchWarningIcon";

const searchIcon = require("../../../../assets/icons/common/search.svg");

type Props = {
  recommendationKeyword?: string | null;
  onPressRecommendation?: (keyword: string) => void;
};

export function SearchEmptyState({
  recommendationKeyword,
  onPressRecommendation,
}: Props) {
  const keyword = recommendationKeyword?.replace(/^#/, "").trim();
  const showRecommendation = !!keyword && !!onPressRecommendation;

  return (
    <View style={styles.container}>
      <SearchWarningIcon size={120} />

      <View style={styles.textGroup}>
        <Text style={styles.title}>검색 결과가 없어요...</Text>
        <Text style={styles.description}>대신 이런 검색어는 어때요?</Text>
      </View>

      {showRecommendation ? (
        <Pressable
          style={({ pressed }) => [
            styles.recommendChip,
            pressed && styles.pressed,
          ]}
          onPress={() => onPressRecommendation(keyword)}
          accessibilityRole="button"
          accessibilityLabel={`${keyword} 검색하기`}
        >
          <Image
            source={searchIcon}
            style={styles.searchIcon}
            contentFit="contain"
            tintColor={C.primary}
          />
          <Text style={styles.recommendText} numberOfLines={1}>
            {keyword}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  textGroup: {
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
    textAlign: "center",
  },
  description: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: "center",
  },
  recommendChip: {
    maxWidth: "100%",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: C.primaryMid,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchIcon: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  recommendText: {
    ...Typography.body2Medium,
    color: C.primary,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
