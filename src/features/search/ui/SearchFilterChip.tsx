import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";

const arrowDownIcon = require("../../../../assets/icons/common/arrow-down.svg");

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SearchFilterChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
      <Image
        source={arrowDownIcon}
        style={[styles.icon, selected && styles.iconSelected]}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
  },
  containerSelected: {
    borderColor: C.textSecondary,
    backgroundColor: Gray[50],
  },
  label: {
    ...Typography.caption1Medium,
    color: Gray[800],
    marginLeft: 6,
  },
  icon: {
    width: 24,
    height: 24,
  },
  iconSelected: {
    transform: [{ rotate: "180deg" }],
  },
  pressed: {
    opacity: 0.75,
  },
});
