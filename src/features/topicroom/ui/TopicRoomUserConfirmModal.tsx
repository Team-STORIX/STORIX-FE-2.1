import { Image } from "expo-image";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { C, Gray, Radius, Typography } from "../../../theme";
import type { TopicRoomActionTarget } from "./TopicRoomUserActionModal";

const profileDefault = require("../../../../assets/placeholders/profile-default.png");

export type ConfirmVariant = "report" | "block";

type Props = {
  visible: boolean;
  variant: ConfirmVariant;
  target: TopicRoomActionTarget | null;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const COPY: Record<
  ConfirmVariant,
  { title: string; description: string; confirmLabel: string }
> = {
  report: {
    title: "신고하기",
    description:
      "이 유저를 신고하시겠습니까?\n접수된 신고는 운영 정책에 따라 검토되며\n신고 내용에 따라 조치 여부가 결정됩니다.",
    confirmLabel: "신고하기",
  },
  block: {
    title: "차단하기",
    description:
      "정말로 위의 유저를 차단하시겠습니까?\n차단한 유저의 메시지는 더 이상 보이지 않으며\n다시 해제하실 수 없습니다.",
    confirmLabel: "차단하기",
  },
};

/**
 * Figma nodes 9085:46663 / 9085:46667 — centered confirmation popup shared by
 * the report and block flows. Confirm actions run the matching mutation and show
 * a pending spinner. Backdrop / cancel dismisses without side effects.
 */
export function TopicRoomUserConfirmModal({
  visible,
  variant,
  target,
  isPending = false,
  onCancel,
  onConfirm,
}: Props) {
  const copy = COPY[variant];

  const handleBackdrop = () => {
    if (isPending) return;
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdrop}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleBackdrop}
        />
        <View style={styles.card}>
          <Text style={styles.title}>{copy.title}</Text>

          <View style={styles.profileRow}>
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

          <Text style={styles.description}>{copy.description}</Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={onCancel}
              disabled={isPending}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>취소</Text>
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
                <Text style={styles.confirmText}>{copy.confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#302d2f",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 306,
    backgroundColor: C.card,
    borderRadius: Radius.sm,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    ...Typography.heading2,
    color: Gray[900],
    textAlign: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Gray[100],
    overflow: "hidden",
  },
  nickname: {
    ...Typography.body2Bold,
    color: Gray[500],
    flexShrink: 1,
  },
  description: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    height: 49,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    ...Typography.body1Medium,
    color: Gray[700],
  },
  confirmBtn: {
    flex: 1,
    height: 49,
    borderRadius: Radius.sm,
    backgroundColor: C.error,
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
