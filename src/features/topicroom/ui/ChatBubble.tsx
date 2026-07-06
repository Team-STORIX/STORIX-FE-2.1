import { Image } from "expo-image";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Typography } from "../../../theme/typography";

const profileDefault = require("../../../../assets/placeholders/profile-default.png");
const kebabIcon = require("../../../../assets/icons/common/menu-3dots.svg");

/** Top-right anchor point (screen coords) of a tapped kebab. */
export type KebabAnchor = { x: number; y: number };

export type DisplayMsg = {
  key: string;
  chatMessageId?: number;
  text: string;
  senderId?: number;
  senderName: string;
  profileImageUrl?: string | null;
  time: string;
  isMe: boolean;
};

type Props = {
  msg: DisplayMsg;
  /** Tapping another user's avatar opens the profile action modal. */
  onPressAvatar?: (msg: DisplayMsg) => void;
  /** Tapping the kebab opens the action dropdown anchored at its top-right. */
  onPressKebab?: (msg: DisplayMsg, anchor: KebabAnchor) => void;
};

export function ChatBubble({ msg, onPressAvatar, onPressKebab }: Props) {
  const kebabRef = useRef<View>(null);

  if (msg.isMe) {
    return (
      <View style={styles.rowMe}>
        <Text style={styles.timeMe}>{msg.time}</Text>
        <View style={[styles.bubble, styles.bubbleMe]}>
          <Text style={styles.textMe}>{msg.text}</Text>
        </View>
      </View>
    );
  }

  // Self-action guard: avatar / kebab affordances only exist for valid other
  // users (a missing or invalid senderId yields no report/block entry point).
  const hasValidSender = typeof msg.senderId === "number";

  const handleAvatar =
    onPressAvatar && hasValidSender ? () => onPressAvatar(msg) : undefined;

  const handleKebab =
    onPressKebab && hasValidSender
      ? () => {
          kebabRef.current?.measureInWindow((x, y, w) => {
            onPressKebab(msg, { x: x + w, y: y + 24 });
          });
        }
      : undefined;

  return (
    <View style={styles.rowOther}>
      <Pressable
        onPress={handleAvatar}
        disabled={!handleAvatar}
        style={({ pressed }) => [
          styles.avatar,
          pressed && handleAvatar ? styles.pressed : null,
        ]}
        accessibilityRole={handleAvatar ? "button" : undefined}
        accessibilityLabel={handleAvatar ? "프로필 보기" : undefined}
      >
        <Image
          source={
            msg.profileImageUrl ? { uri: msg.profileImageUrl } : profileDefault
          }
          style={styles.avatarImage}
          contentFit={msg.profileImageUrl ? "cover" : "contain"}
        />
      </Pressable>
      <View style={styles.otherBody}>
        <Text style={styles.senderName}>{msg.senderName || "익명"}</Text>
        <View style={styles.otherBubbleRow}>
          <View style={[styles.bubble, styles.bubbleOther]}>
            <Text style={styles.textOther}>{msg.text}</Text>
          </View>
          <Text style={styles.timeOther}>{msg.time}</Text>
          {handleKebab ? (
            <Pressable
              ref={kebabRef}
              onPress={handleKebab}
              hitSlop={8}
              style={({ pressed }) => [
                styles.kebab,
                pressed ? styles.pressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="메시지 메뉴 열기"
            >
              <Image
                source={kebabIcon}
                style={styles.kebabIcon}
                contentFit="contain"
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 36;
const BUBBLE_MAX_WIDTH = 220;
const TIME_WIDTH = 47;

const styles = StyleSheet.create({
  rowMe: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rowOther: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryLight,
    overflow: "hidden",
    marginRight: 8,
    flexShrink: 0,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },

  otherBody: { flexShrink: 1 },
  senderName: {
    ...Typography.body2Medium,
    color: Gray[800],
    marginBottom: 4,
  },
  otherBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  bubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: {
    backgroundColor: C.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  bubbleOther: {
    backgroundColor: Gray[50],
    borderWidth: 1,
    borderColor: Gray[100],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  pressed: {
    opacity: 0.7,
  },

  textMe: { ...Typography.body1Semibold, color: C.card },
  textOther: { ...Typography.body1Medium, color: Gray[800] },

  timeMe: {
    ...Typography.caption1Medium,
    color: Gray[400],
    width: TIME_WIDTH,
    textAlign: "right",
    marginRight: 6,
    marginBottom: 2,
  },
  timeOther: {
    ...Typography.caption1Medium,
    color: Gray[400],
    width: TIME_WIDTH,
    marginLeft: 6,
    marginBottom: 2,
    flexShrink: 0,
  },

  kebab: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
    marginBottom: 2,
    alignSelf: "flex-end",
    flexShrink: 0,
  },
  kebabIcon: {
    width: 16,
    height: 16,
  },
});
