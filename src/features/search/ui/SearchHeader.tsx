import { Image } from "expo-image";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";

const backIcon = require("../../../../assets/icons/common/back.svg");
const searchIcon = require("../../../../assets/icons/common/search.svg");
const cancelIcon = require("../../../../assets/icons/search/icon-delete-medium.svg");

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onBackPress: () => void;
  showCancelIcon: boolean;
};

export function SearchHeader({
  value,
  onChangeText,
  onSubmit,
  onBackPress,
  showCancelIcon,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        onPress={onBackPress}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Image
          source={backIcon}
          style={styles.leadingIcon}
          contentFit="contain"
        />
      </Pressable>

      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="좋아하는 작품/토픽룸을 검색해보세요"
          placeholderTextColor={C.textMuted}
          style={styles.input}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={showCancelIcon ? () => onChangeText("") : onSubmit}
          accessibilityRole="button"
          accessibilityLabel={showCancelIcon ? "검색어 지우기" : "검색"}
        >
          <Image
            source={showCancelIcon ? cancelIcon : searchIcon}
            style={showCancelIcon ? styles.cancelIcon : styles.searchIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.card,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.sm,
    backgroundColor: Gray[50],
    paddingLeft: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    ...Typography.body1Medium,
    color: C.text,
    paddingVertical: 12,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  leadingIcon: {
    width: 24,
    height: 24,
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  cancelIcon: {
    width: 12,
    height: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
