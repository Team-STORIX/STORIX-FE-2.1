import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { FontFamily, Typography } from "../../../theme/typography";

const activeIcon = require("../../../../assets/icons/common/active.svg");
const deactiveIcon = require("../../../../assets/icons/common/deactive.svg");
const checkPinkIcon = require("../../../../assets/icons/common/check-pink-200-xs.svg");
const checkGrayIcon = require("../../../../assets/icons/common/check-gray.svg");

const MAX_SPOILER_LENGTH = 50;

type Props = {
  enabled: boolean;
  onToggle: () => void;
  message: string;
  onMessageChange: (next: string) => void;
  defaultMessage?: string;
};

export function SpoilerToggleSection({
  enabled,
  onToggle,
  message,
  onMessageChange,
  defaultMessage = "스포일러가 포함된 피드 보기",
}: Props) {
  const isDefault = message === defaultMessage;
  const onPressDefault = () => {
    if (isDefault) onMessageChange("");
    else onMessageChange(defaultMessage);
  };

  const counterColor =
    message.length === MAX_SPOILER_LENGTH
      ? styles.counterWarning
      : styles.counterValue;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>스포일러 방지 문구</Text>
        <View style={styles.toggleArea}>
          <Text style={styles.toggleLabel}>스포일러 방지</Text>
          <Pressable
            onPress={onToggle}
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled }}
            accessibilityLabel="스포일러 방지 토글"
            hitSlop={6}
          >
            <Image
              source={enabled ? activeIcon : deactiveIcon}
              style={styles.toggleIcon}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>

      <TextInput
        value={message}
        editable={enabled}
        maxLength={MAX_SPOILER_LENGTH}
        onChangeText={(next) =>
          onMessageChange(
            next.length > MAX_SPOILER_LENGTH
              ? next.slice(0, MAX_SPOILER_LENGTH)
              : next,
          )
        }
        placeholder="스포일러 방지 문구를 입력하세요 (예: 괴출 최신화 포함)"
        placeholderTextColor={enabled ? C.textMuted : Gray[200]}
        style={[styles.input, !enabled && styles.inputDisabled]}
      />

      {enabled ? (
        <View style={styles.bottomRow}>
          <Pressable
            onPress={onPressDefault}
            style={styles.defaultRow}
            accessibilityRole="button"
            accessibilityLabel="기본 문구 사용하기"
          >
            <Image
              source={isDefault ? checkPinkIcon : checkGrayIcon}
              style={styles.checkIcon}
              contentFit="contain"
            />
            <Text style={styles.defaultText}>기본 문구 사용하기</Text>
          </Pressable>

          <Text style={styles.counterText}>
            <Text style={counterColor}>{message.length}</Text>
            <Text style={counterColor}>/{MAX_SPOILER_LENGTH}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 2.0: -mx-4 px-4 py-6 border-bottom gap-4
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginHorizontal: -16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    ...Typography.body1Bold,
    color: C.text,
    paddingLeft: 4,
  },
  toggleArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleLabel: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  toggleIcon: {
    width: 32,
    height: 18,
  },
  input: {
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 0,
    paddingBottom: 2,
    ...Typography.body2Medium,
    fontFamily: FontFamily.medium,
    color: C.text,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  inputDisabled: {
    backgroundColor: C.card,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkIcon: {
    width: 18,
    height: 18,
  },
  defaultText: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  counterText: {
    ...Typography.caption1Medium,
  },
  counterValue: {
    color: Gray[500],
  },
  counterWarning: {
    color: Gray[500],
  },
});
