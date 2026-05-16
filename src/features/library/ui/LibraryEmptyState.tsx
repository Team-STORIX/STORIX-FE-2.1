import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, Radius, Typography } from "../../../theme";

const warningIcon = require("../../../../assets/icons/search/warning.svg");

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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 120,
    gap: 12,
  },
  icon: {
    width: 120,
    height: 120,
  },
  textWrap: {
    alignItems: "center",
    gap: 4,
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
    marginTop: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: C.primaryMid,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  buttonText: {
    ...Typography.body2Medium,
    color: C.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
