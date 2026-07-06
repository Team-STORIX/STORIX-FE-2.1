import { Image } from "expo-image";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { C, Gray, Radius, Typography } from "../../../theme";

const sirenIcon = require("../../../../assets/topicroom/icon-siren.svg");
const blockIcon = require("../../../../assets/topicroom/icon-block.svg");
const closeIcon = require("../../../../assets/icons/common/x.svg");
const profileDefault = require("../../../../assets/placeholders/profile-default.png");

/**
 * Shared target shape used by both the profile-image modal and the chat-bubble
 * kebab dropdown so the report / block flows are identical regardless of entry
 * point. Never built for the current user (self-actions are blocked upstream).
 */
export type TopicRoomActionTarget = {
  userId: number;
  chatMessageId?: number;
  nickname: string;
  profileImageUrl?: string | null;
};

type Props = {
  visible: boolean;
  target: TopicRoomActionTarget | null;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
};

/**
 * Figma node 9085:46633 — full-screen dim overlay with a centered profile card.
 * Top-right action row exposes report (siren) / block / close. Tapping the
 * backdrop or the X closes; the avatar/nickname content itself is inert.
 */
export function TopicRoomUserActionModal({
  visible,
  target,
  onClose,
  onReport,
  onBlock,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionHit}
              hitSlop={8}
              onPress={onReport}
              accessibilityRole="button"
              accessibilityLabel="신고하기"
            >
              <Image
                source={sirenIcon}
                style={styles.actionIcon}
                contentFit="contain"
              />
            </Pressable>
            <Pressable
              style={styles.actionHit}
              hitSlop={8}
              onPress={onBlock}
              accessibilityRole="button"
              accessibilityLabel="차단하기"
            >
              <Image
                source={blockIcon}
                style={styles.actionIcon}
                contentFit="contain"
              />
            </Pressable>
            <Pressable
              style={styles.actionHit}
              hitSlop={8}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <Image
                source={closeIcon}
                style={styles.actionIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>

          <View style={styles.profileBlock}>
            <Image
              source={
                target?.profileImageUrl
                  ? { uri: target.profileImageUrl }
                  : profileDefault
              }
              style={styles.avatar}
              contentFit={target?.profileImageUrl ? "cover" : "contain"}
            />
            <Text style={styles.nickname} numberOfLines={1}>
              {target?.nickname || "익명"}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const AVATAR_SIZE = 72;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(19, 17, 18, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 306,
    backgroundColor: C.card,
    borderRadius: Radius.sm,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
  },
  actionHit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  profileBlock: {
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Gray[100],
    overflow: "hidden",
  },
  nickname: {
    ...Typography.body1Semibold,
    color: Gray[900],
    textAlign: "center",
  },
});
