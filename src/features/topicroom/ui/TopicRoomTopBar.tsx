import { Image } from "expo-image";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, Gray, Typography } from "../../../theme";

const backIcon = require("../../../../assets/icons/common/back.svg");
const menuIcon = require("../../../../assets/icons/common/menu-3dots.svg");

type Props = {
  topInset: number;
  title: string;
  subtitle?: string;
  memberCount?: number;
  onBack: () => void;
  onPressMenu?: (dropdownTop: number) => void;
};

export function TopicRoomTopBar({
  topInset,
  title,
  subtitle,
  memberCount,
  onBack,
  onPressMenu,
}: Props) {
  const menuButtonRef = useRef<View>(null);

  const handlePressMenu = () => {
    menuButtonRef.current?.measureInWindow((_x, y, _width, height) => {
      onPressMenu?.(y + height + 12);
    });
  };

  return (
    <View style={[styles.container, { paddingTop: topInset + 12 }]}>
      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Image source={backIcon} style={styles.icon} contentFit="contain" />
      </Pressable>

      <View style={styles.titleWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {typeof memberCount === "number" ? (
            <Text style={styles.memberText}>{memberCount}</Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onPressMenu ? (
        <Pressable
          ref={menuButtonRef}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
          onPress={handlePressMenu}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="토픽룸 메뉴 열기"
        >
          <Image source={menuIcon} style={styles.icon} contentFit="contain" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.card,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
  titleWrap: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    ...Typography.heading2,
    color: Gray[900],
    flexShrink: 1,
  },
  memberText: {
    ...Typography.body2Bold,
    color: Gray[500],
    flexShrink: 0,
  },
  subtitle: {
    ...Typography.body2Medium,
    color: Gray[500],
    marginTop: 4,
  },
  pressed: {
    opacity: 0.6,
  },
});
