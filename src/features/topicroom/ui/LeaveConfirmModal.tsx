import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { C, Gray, Radius, Typography } from "../../../theme";

type Props = {
  visible: boolean;
  isPending?: boolean;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function LeaveConfirmModal({
  visible,
  isPending = false,
  title = "토픽룸 나가기",
  description = "정말 토픽룸에서 퇴장하시겠습니까?",
  cancelLabel = "취소",
  confirmLabel = "나가기",
  onClose,
  onConfirm,
}: Props) {
  const handleBackdrop = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdrop}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={handleBackdrop}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && styles.pressed,
                ]}
                onPress={onClose}
                disabled={isPending}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  pressed && styles.pressed,
                  isPending && styles.confirmBtnDisabled,
                ]}
                onPress={onConfirm}
                disabled={isPending}
                accessibilityRole="button"
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={C.card} />
                ) : (
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backdropTouchable: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 306,
    backgroundColor: C.card,
    borderRadius: Radius.md,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: C.black,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    ...Typography.heading3,
    color: C.text,
    textAlign: "center",
  },
  description: {
    marginTop: 6,
    ...Typography.body2Medium,
    color: C.textSecondary,
    textAlign: "center",
  },
  actions: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    ...Typography.body1Medium,
    color: C.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Gray[900],
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  pressed: {
    opacity: 0.8,
  },
});
