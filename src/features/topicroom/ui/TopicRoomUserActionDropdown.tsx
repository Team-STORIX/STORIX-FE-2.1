import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { C, Gray, Magenta, Radius, Typography } from "../../../theme";

/** Top-right anchor point (screen coords) of the tapped message kebab. */
export type DropdownAnchor = { x: number; y: number };

type Props = {
  visible: boolean;
  /** Screen-space top-right corner of the kebab the dropdown hangs from. */
  anchor: DropdownAnchor | null;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
};

const DROPDOWN_WIDTH = 96;
const SCREEN_PADDING = 8;

/**
 * Figma node 9107:42706 — dim overlay + a small white card anchored under the
 * message kebab. Outside press closes. 신고하기 opens the report confirmation,
 * 차단하기 opens the block confirmation, both using the message sender as target.
 */
export function TopicRoomUserActionDropdown({
  visible,
  anchor,
  onClose,
  onReport,
  onBlock,
}: Props) {
  // Right-align the card to the kebab, clamped to stay on-screen.
  const left = anchor
    ? Math.max(SCREEN_PADDING, anchor.x - DROPDOWN_WIDTH)
    : SCREEN_PADDING;
  const top = anchor ? anchor.y + 4 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {anchor ? (
          <View style={[styles.menu, { left, top }]} pointerEvents="box-none">
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={onReport}
              accessibilityRole="button"
            >
              <Text style={styles.reportText}>신고하기</Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={onBlock}
              accessibilityRole="button"
            >
              <Text style={styles.blockText}>차단하기</Text>
            </Pressable>
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(19, 17, 18, 0.6)",
  },
  menu: {
    position: "absolute",
    width: DROPDOWN_WIDTH,
    backgroundColor: C.card,
    borderRadius: Radius.xs,
    padding: 8,
    gap: 6,
    shadowColor: "#131112",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  row: {
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  rowPressed: {
    opacity: 0.6,
  },
  reportText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  blockText: {
    ...Typography.body2Medium,
    color: Magenta[300],
  },
  divider: {
    alignSelf: "center",
    height: 1,
    width: 80,
    backgroundColor: Gray[100],
  },
});
