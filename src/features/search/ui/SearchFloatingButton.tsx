import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Shadow } from "../../../theme/shadows";
import { Typography } from "../../../theme/typography";

const fireIcon = require("../../../../assets/icons/common/fire.svg");
const forwardIcon = require("../../../../assets/icons/common/icon-arrow-forward-small.svg");

const REQUEST_URL =
  "https://truth-gopher-09e.notion.site/2ede81f70948801bb0f4ecc8e76a6015";

export function SearchFloatingButton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 24 }]}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {
          void Linking.openURL(REQUEST_URL);
        }}
        accessibilityRole="button"
        accessibilityLabel="찾는 작품이 없다면 요청하기"
      >
        <View style={styles.leading}>
          <Image
            source={fireIcon}
            style={styles.fireIcon}
            contentFit="contain"
          />
          <Text style={styles.label}>찾는 작품이 없다면?</Text>
        </View>
        <Image
          source={forwardIcon}
          style={styles.arrowIcon}
          contentFit="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  button: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    minWidth: 210,
    ...Shadow.lg,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  fireIcon: {
    width: 20,
    height: 20,
  },
  label: {
    ...Typography.body2Medium,
    color: C.card,
  },
  arrowIcon: {
    width: 18,
    height: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
