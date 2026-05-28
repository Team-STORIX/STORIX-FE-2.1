import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, Gray, Magenta } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import { FeedPostCard, type PostCardWorks } from "../../feed/ui/FeedPostCard";
const bottomSheetHandle = require("../../../../assets/icons/plus/stroke_line.svg");
const birthdayCakeIcon = require("../../../../assets/icons/plus/mingcute_birthday-2-fill.svg");

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (enabled: boolean) => void;
  initialEnabled?: boolean;
  draft: {
    nickName: string;
    profileImageUrl?: string | null;
    content: string;
    images?: string[];
    works?: PostCardWorks | null;
    isSpoiler: boolean;
    spoilerScript?: string;
  };
};

export function BirthdayThemePreviewBottomSheet({
  visible,
  onClose,
  onApply,
  initialEnabled = false,
  draft,
}: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [previewBirthdayEnabled, setPreviewBirthdayEnabled] =
    useState(initialEnabled);

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    setPreviewBirthdayEnabled(initialEnabled);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [initialEnabled, progress, visible]);

  const handleClose = (after?: () => void) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
        after?.();
      }
    });
  };

  if (!visible) return null;

  const onPressApply = () => {
    handleClose(() => onApply(previewBirthdayEnabled));
  };
  const onPressToggle = () => {
    setPreviewBirthdayEnabled((prev) => !prev);
  };
  const PREVIEW_FALLBACK_HASHTAGS = ["로판", "성장물", "순애"];
  const previewWorks = draft.works
    ? {
        ...draft.works,
        hashtags:
          draft.works.hashtags.length > 0
            ? draft.works.hashtags
            : draft.works.genre
              ? [draft.works.genre, ...PREVIEW_FALLBACK_HASHTAGS].slice(0, 3)
              : PREVIEW_FALLBACK_HASHTAGS,
      }
    : null;

  return (
    <Modal
      transparent
      animationType="none"
      visible
      onRequestClose={() => handleClose()}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => handleClose()}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 18,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <Image
              source={bottomSheetHandle}
              style={styles.handleImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.header}>
            <Pressable
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            />
            <Text style={styles.title}>생일테마 미리보기</Text>
            <Pressable
              onPress={onPressApply}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="완료"
            >
              <Text style={styles.badge}>완료</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.previewScroll}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.previewCardWrap}>
              <FeedPostCard
                variant="detail"
                boardId={-1}
                writerUserId={-1}
                profileImageUrl={draft.profileImageUrl ?? undefined}
                nickName={draft.nickName || "나"}
                createdAt="방금 전"
                content={draft.content}
                images={draft.images ?? []}
                works={previewWorks}
                isSpoiler={draft.isSpoiler}
                spoilerScript={draft.spoilerScript}
                isLiked={false}
                likeCount={12}
                replyCount={9}
                onToggleLike={() => {}}
                birthdayTheme={previewBirthdayEnabled}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerLabel}>생일 테마</Text>
            <Pressable
              onPress={onPressToggle}
              accessibilityRole="switch"
              accessibilityState={{ checked: previewBirthdayEnabled }}
              accessibilityLabel="생일 테마 미리보기 토글"
              style={({ pressed }) => [
                styles.toggleButton,
                previewBirthdayEnabled
                  ? styles.toggleButtonOn
                  : styles.toggleButtonOff,
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={birthdayCakeIcon}
                style={[
                  styles.toggleIcon,
                  {
                    tintColor: previewBirthdayEnabled ? C.card : Gray[400],
                  },
                ]}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: Gray[50],
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
  },
  handleImage: {
    width: 52,
    height: 4,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
  },
  badge: {
    ...Typography.body1Medium,
    color: C.badgeText,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewScroll: {
    maxHeight: 480,
    paddingVertical: 20,
  },
  previewCardWrap: {
    marginHorizontal: 16,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: "center",
    gap: 12,
  },
  footerLabel: {
    ...Typography.body1Medium,
    color: C.text,
  },
  toggleButton: {
    borderWidth: 2,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonOff: {
    backgroundColor: C.card,
    borderColor: Gray[200],
  },
  toggleButtonOn: {
    backgroundColor: Magenta[100],
    borderColor: Magenta[300],
  },
  toggleIcon: {
    width: 36,
    height: 36,
    margin: 16,
  },
  primaryButton: {
    height: 48,
    backgroundColor: Gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...Typography.body1Medium,
    color: Gray[400],
  },
  pressed: {
    opacity: 0.85,
  },
});
