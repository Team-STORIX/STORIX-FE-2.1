import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, Magenta, Radius, Typography } from "../../../theme";

const warningIcon = require("../../../../assets/icons/search/warning.png");

type Props = {
  title: string;
  description?: string;
  buttonText?: string;
  onPressButton?: () => void;
};

export function LibraryEmptyState({
  title,
  description,
  buttonText,
  onPressButton,
}: Props) {
  return (
    <View style={styles.container}>
      <Image source={warningIcon} style={styles.icon} contentFit="contain" />

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>

      {buttonText && onPressButton ? (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={onPressButton}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 20,
  },
  icon: {
    width: 100,
    height: 100,
  },
  textWrap: {
    alignItems: "center",
    gap: 12,
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
  button: {
    marginTop: -8,
    height: 36,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Magenta[100],
    backgroundColor: Magenta[20],
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...Typography.caption1Semibold,
    color: Magenta[300],
  },
  pressed: {
    opacity: 0.75,
  },
});
