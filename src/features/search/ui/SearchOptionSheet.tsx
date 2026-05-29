import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, Gray, Typography , FontFamily} from "../../../theme";

const cancelIcon = require("../../../../assets/icons/common/cancel.svg");
const checkIcon = require("../../../../assets/icons/search/icon-check.svg");
const checkPinkIcon = require("../../../../assets/icons/common/check-pink.svg");
const checkGrayIcon = require("../../../../assets/icons/common/check-gray.svg");

type Option = {
  value: string;
  label: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  value: string[];
  multiple?: boolean;
  resetValue?: string[];
  onClose: () => void;
  onApply: (value: string[]) => void;
};

export function SearchOptionSheet({
  visible,
  title,
  options,
  value,
  multiple = false,
  resetValue,
  onClose,
  onApply,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<string[]>(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [value, visible]);

  const handleToggle = (optionValue: string) => {
    if (multiple) {
      setDraft((prev) =>
        prev.includes(optionValue)
          ? prev.filter((item) => item !== optionValue)
          : prev.concat(optionValue),
      );
      return;
    }

    setDraft([optionValue]);
  };

  const handleReset = () => {
    setDraft(resetValue ?? []);
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="시트 닫기"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 36 }]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="닫기"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={cancelIcon}
                style={styles.closeIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const selected = draft.includes(option.value);

              if (multiple) {
                const iconSource = selected ? checkPinkIcon : checkGrayIcon;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.checkRow,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleToggle(option.value)}
                    accessibilityRole="button"
                    accessibilityState={selected ? { selected: true } : {}}
                  >
                    <Image
                      source={iconSource}
                      style={styles.checkIcon}
                      contentFit="contain"
                    />
                    <Text style={styles.checkLabel}>{option.label}</Text>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.sortRow,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleToggle(option.value)}
                  accessibilityRole="button"
                  accessibilityState={selected ? { selected: true } : {}}
                >
                  <Text style={styles.sortLabel}>{option.label}</Text>
                  {selected ? (
                    <Image
                      source={checkIcon}
                      style={styles.sortCheckIcon}
                      contentFit="contain"
                    />
                  ) : (
                    <View style={styles.sortCheckIcon} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.pressed,
              ]}
              onPress={handleReset}
              accessibilityRole="button"
            >
              <Text style={styles.resetLabel}>초기화</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                pressed && styles.pressed,
              ]}
              onPress={handleApply}
              accessibilityRole="button"
            >
              <Text style={styles.applyLabel}>적용하기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 16,
    maxHeight: 580,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  divider: {
    marginTop: 24,
    marginHorizontal: -16,
    height: 1,
    backgroundColor: Gray[100],
  },
  optionsScroll: {
    flexShrink: 1,
  },
  optionsContent: {
    paddingTop: 28,
    paddingBottom: 28,
    gap: 20,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  sortLabel: {
    ...Typography.body1Medium,
    color: C.text,
  },
  sortCheckIcon: {
    width: 20,
    height: 20,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingLeft: 4,
  },
  checkIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  checkLabel: {
    ...Typography.body1Medium,
    color: C.text,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButton: {
    height: 56,
    minWidth: 110,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Gray[100],
  },
  resetLabel: {
    ...Typography.body1Bold,
    color: C.text,
  },
  applyButton: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  applyLabel: {
    ...Typography.body1Bold,
    color: C.card,
  },
  pressed: {
    opacity: 0.85,
  },
});
