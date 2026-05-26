import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, Gray, Radius, Shadow, Typography } from "../../../theme";
import type { TopicRoomMember } from "../api";

const cancelIcon = require("../../../../assets/icons/common/cancel.svg");
const profileDefault = require("../../../../assets/icons/profile/profile-default.svg");
const checkPinkIcon = require("../../../../assets/icons/common/check-pink.svg");
const checkGrayIcon = require("../../../../assets/icons/common/check-gray.svg");

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "ABUSE", label: "욕설, 비방, 혐오 표현을 해요" },
  { value: "PHISHING", label: "보이스 피싱과 같이 다른 채널로 유도해요" },
  { value: "OTHER", label: "기타" },
];

const OTHER_REASON_MAX = 200;

type Props = {
  visible: boolean;
  members: TopicRoomMember[];
  myUserId?: number | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (params: {
    userId: number;
    reason: string;
    otherReason?: string | null;
  }) => void;
};

export function TopicRoomReportSheet({
  visible,
  members,
  myUserId,
  isSubmitting = false,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");

  useEffect(() => {
    if (!visible) {
      setSelectedUserId(null);
      setSelectedReason(null);
      setOtherReason("");
    }
  }, [visible]);

  const reportable = useMemo(
    () => members.filter((m) => m.userId !== myUserId),
    [members, myUserId],
  );

  const trimmedOther = otherReason.trim();
  const otherInvalid = selectedReason === "OTHER" && trimmedOther.length === 0;
  const canSubmit =
    !isSubmitting &&
    selectedUserId != null &&
    selectedReason != null &&
    !otherInvalid;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => {
            if (!isSubmitting) onClose();
          }}
          accessibilityLabel="시트 닫기"
          accessibilityRole="button"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>신고하기</Text>
            <Pressable
              onPress={() => {
                if (!isSubmitting) onClose();
              }}
              style={styles.closeButton}
            >
              <Image
                source={cancelIcon}
                style={styles.closeIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>

          <Text style={styles.warningCopy}>
            허위 신고 시 서비스 이용에 제한이 있을 수 있어요.
          </Text>

          <Text style={styles.sectionLabel}>신고할 유저</Text>
          {reportable.length === 0 ? (
            <View style={styles.emptyMembers}>
              <Text style={styles.emptyMembersText}>
                신고할 수 있는 다른 참여자가 없어요.
              </Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={reportable}
              keyExtractor={(item) => String(item.userId)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.memberList}
              renderItem={({ item }) => {
                const selected = item.userId === selectedUserId;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.memberCell,
                      selected && styles.memberCellSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedUserId(item.userId)}
                    accessibilityRole="button"
                    accessibilityState={selected ? { selected: true } : {}}
                  >
                    <Image
                      source={
                        item.profileImageUrl
                          ? { uri: item.profileImageUrl }
                          : profileDefault
                      }
                      style={styles.memberAvatar}
                      contentFit="cover"
                    />
                    <Text style={styles.memberName} numberOfLines={1}>
                      {item.nickName || "익명"}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          <Text style={[styles.sectionLabel, styles.reasonHeading]}>
            신고 사유
          </Text>
          <View style={styles.reasonList}>
            {REPORT_REASONS.map((reason) => {
              const selected = reason.value === selectedReason;
              return (
                <Pressable
                  key={reason.value}
                  onPress={() => setSelectedReason(reason.value)}
                  style={({ pressed }) => [
                    styles.reasonRow,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={selected ? { selected: true } : {}}
                >
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
                  <Image
                    source={selected ? checkPinkIcon : checkGrayIcon}
                    style={styles.reasonIcon}
                    contentFit="contain"
                  />
                </Pressable>
              );
            })}
          </View>

          {selectedReason === "OTHER" ? (
            <View style={styles.otherWrap}>
              <TextInput
                value={otherReason}
                onChangeText={(t) =>
                  setOtherReason(t.slice(0, OTHER_REASON_MAX))
                }
                placeholder="신고 사유를 직접 입력해 주세요"
                placeholderTextColor={C.textMuted}
                multiline
                style={styles.otherInput}
                maxLength={OTHER_REASON_MAX}
                editable={!isSubmitting}
              />
              <Text style={styles.otherCounter}>
                {trimmedOther.length}/{OTHER_REASON_MAX}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => {
              if (!canSubmit) return;
              onConfirm({
                userId: selectedUserId!,
                reason: selectedReason!,
                otherReason: selectedReason === "OTHER" ? trimmedOther : null,
              });
            }}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={C.card} />
            ) : (
              <Text style={styles.submitLabel}>신고 접수</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingTop: 18,
    ...Shadow.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    ...Typography.heading3,
    color: C.text,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 18,
    height: 18,
  },
  warningCopy: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    marginBottom: 16,
  },
  sectionLabel: {
    ...Typography.body2Bold,
    color: C.text,
    marginBottom: 8,
  },
  reasonHeading: {
    marginTop: 18,
  },
  otherWrap: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.divider,
    borderRadius: Radius.sm,
    backgroundColor: C.bg,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  otherInput: {
    minHeight: 72,
    ...Typography.body2Medium,
    color: C.text,
    paddingVertical: 0,
    textAlignVertical: "top",
  },
  otherCounter: {
    ...Typography.caption2Medium,
    color: C.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  emptyMembers: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyMembersText: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  memberList: {
    paddingVertical: 4,
    gap: 12,
  },
  memberCell: {
    width: 76,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
    borderRadius: Radius.sm,
  },
  memberCellSelected: {
    backgroundColor: C.primaryLight,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Gray[100],
    marginBottom: 6,
  },
  memberName: {
    ...Typography.caption1Medium,
    color: C.text,
    textAlign: "center",
  },
  reasonList: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: C.divider,
    overflow: "hidden",
  },
  reasonRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  reasonLabel: {
    ...Typography.body2Medium,
    color: C.text,
  },
  reasonIcon: {
    width: 22,
    height: 22,
  },
  submitButton: {
    marginTop: 18,
    height: 52,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },
  submitButtonDisabled: {
    backgroundColor: C.primaryLight,
  },
  submitLabel: {
    ...Typography.body1Semibold,
    color: C.card,
  },
  pressed: {
    opacity: 0.85,
  },
});
