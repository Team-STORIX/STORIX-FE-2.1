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
    <View style={[styles.wrap, { bottom: insets.bottom + 12 }]}>
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
          <Image
            source={forwardIcon}
            style={styles.arrowIcon}
            contentFit="contain"
          />
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...Shadow.lg,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  fireIcon: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  label: {
    ...Typography.body2Medium,
    color: C.card,
  },
  arrowIcon: {
    width: 24,
    height: 24,
    tintColor: C.card,
  },
  pressed: {
    opacity: 0.85,
  },
});
