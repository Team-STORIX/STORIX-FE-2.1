import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Typography } from "../../../theme/typography";

const profileDefault = require("../../../../assets/placeholders/profile-default.png");

export type DisplayMsg = {
  key: string;
  text: string;
  senderId?: number;
  senderName: string;
  profileImageUrl?: string | null;
  time: string;
  isMe: boolean;
};

type Props = {
  msg: DisplayMsg;
  onLongPressOther?: (msg: DisplayMsg) => void;
};

export function ChatBubble({ msg, onLongPressOther }: Props) {
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

  const handleLongPress = onLongPressOther
    ? () => onLongPressOther(msg)
    : undefined;

  return (
    <View style={styles.rowOther}>
      <View style={styles.avatar}>
        <Image
          source={
            msg.profileImageUrl ? { uri: msg.profileImageUrl } : profileDefault
          }
          style={styles.avatarImage}
          contentFit={msg.profileImageUrl ? "cover" : "contain"}
        />
      </View>
      <View style={styles.otherBody}>
        <Text style={styles.senderName}>{msg.senderName || "익명"}</Text>
        <View style={styles.otherBubbleRow}>
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.bubble,
              styles.bubbleOther,
              pressed && handleLongPress ? styles.pressed : null,
            ]}
          >
            <Text style={styles.textOther}>{msg.text}</Text>
          </Pressable>
          <Text style={styles.timeOther}>{msg.time}</Text>
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

  textMe: { ...Typography.body1Semibold, color: "#fff" },
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
});
