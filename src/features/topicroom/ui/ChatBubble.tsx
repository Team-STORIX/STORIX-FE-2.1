import { Image } from "expo-image";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Typography } from "../../../theme/typography";
import { OfficialMark } from "../../../components/common/OfficialMark";

const profileDefault = require("../../../../assets/placeholders/profile-default.png");
const kebabIcon = require("../../../../assets/icons/common/menu-3dots.svg");

/** Top-right anchor point (screen coords) of a tapped kebab. */
export type KebabAnchor = { x: number; y: number };

export type DisplayMsg = {
  key: string;
  chatMessageId?: number;
  text: string;
  createdAt?: string | null;
  senderId?: number;
  senderName: string;
  senderRole?: string | null;
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
        <Text style={styles.timeMe} numberOfLines={1}>
          {msg.time}
        </Text>
        <View style={[styles.bubble, styles.bubbleMe, styles.bubbleMeWidth]}>
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
          kebabRef.current?.measureInWindow((x, y, w, h) => {
            onPressKebab(msg, { x: x + w, y: y + h });
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
        <View style={styles.senderNameRow}>
          <Text style={styles.senderName} numberOfLines={1}>{msg.senderName || "익명"}</Text>
          <OfficialMark role={msg.senderRole} />
        </View>
        <View style={styles.otherBubbleRow}>
          <View
            style={[styles.bubble, styles.bubbleOther, styles.bubbleOtherWidth]}
          >
            <Text style={styles.textOther}>{msg.text}</Text>
          </View>
          <Text style={styles.timeOther} numberOfLines={1}>
            {msg.time}
          </Text>
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
                tintColor={Gray[400]}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 36;
const BUBBLE_ME_MAX_WIDTH = 244;
const BUBBLE_OTHER_MAX_WIDTH = 220;
const TIME_LINE_HEIGHT = Typography.caption1Medium.lineHeight;
const TIME_META_OFFSET_Y = 2;
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

  otherBody: { flexShrink: 1, minWidth: 0 },
  senderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    marginBottom: 4,
  },
  senderName: {
    ...Typography.body2Medium,
    color: Gray[800],
    flexShrink: 1,
  },
  otherBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMeWidth: {
    maxWidth: BUBBLE_ME_MAX_WIDTH,
    flexShrink: 1,
  },
  bubbleOtherWidth: {
    maxWidth: BUBBLE_OTHER_MAX_WIDTH,
    flexShrink: 1,
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
    minWidth: 0,
    textAlign: "right",
    marginRight: 4,
    flexShrink: 0,
  },
  timeOther: {
    ...Typography.caption1Medium,
    color: Gray[400],
    minWidth: 0,
    marginLeft: 4,
    flexShrink: 0,
    transform: [{ translateY: TIME_META_OFFSET_Y }],
  },

  kebab: {
    width: 24,
    height: TIME_LINE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
    alignSelf: "flex-end",
    flexShrink: 0,
    transform: [{ translateY: TIME_META_OFFSET_Y }],
  },
  kebabIcon: {
    width: 16,
    height: 16,
  },
});
