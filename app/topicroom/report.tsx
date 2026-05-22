import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfileStore } from "../../src/features/profile";
import {
  useReportTopicRoomUser,
  useTopicRoomMembers,
} from "../../src/features/topicroom";
import { C, Gray, Magenta, Radius, Typography } from "../../src/theme";

const backIcon = require("../../assets/icons/common/back.svg");
const arrowDownIcon = require("../../assets/icons/common/arrow-down.svg");
const arrowUpIcon = require("../../assets/icons/common/arrow-up.svg");
const profileDefault = require("../../assets/placeholders/profile-default.png");

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "ABUSE", label: "욕설, 비방, 혐오 표현을 해요" },
  { value: "PHISHING", label: "보이스 피싱과 같이 다른 채널로 유도해요" },
  { value: "OTHER", label: "기타" },
];

const NOTICE_BULLETS = [
  "대화 중 불편사항이 발생했다면, 다른 유저를 신고할 수 있어요",
  "신고 내용이 사실과 다를 경우 제재를 받을 수 있으니 주의해주세요",
  "신고 대상인 유저의 닉네임을 정확히 선택해주세요",
];

const DETAIL_MAX = 100;

export default function TopicRoomReportScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    reportedUserId?: string;
    reportedUserName?: string;
    reportedUserProfileImageUrl?: string;
  }>();
  const roomId = typeof params.roomId === "string" ? Number(params.roomId) : 0;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myUserId = useProfileStore((s) => s.me?.userId ?? null);

  const membersQuery = useTopicRoomMembers(roomId);
  const reportMutation = useReportTopicRoomUser();

  const paramUserId =
    params.reportedUserId != null && params.reportedUserId !== ""
      ? Number(params.reportedUserId)
      : null;

  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    paramUserId,
  );
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Reportable participants: everyone except the current user.
  const reportable = useMemo(
    () => (membersQuery.data ?? []).filter((m) => m.userId !== myUserId),
    [membersQuery.data, myUserId],
  );

  // Display info for the currently selected target. Prefer the live member
  // record; fall back to the params passed from a chat long-press.
  const selectedDisplay = useMemo(() => {
    const member = reportable.find((m) => m.userId === selectedUserId);
    if (member) {
      return {
        name: member.nickName || "익명",
        profileImageUrl: member.profileImageUrl,
      };
    }
    if (selectedUserId != null && selectedUserId === paramUserId) {
      return {
        name: params.reportedUserName || "익명",
        profileImageUrl: params.reportedUserProfileImageUrl || null,
      };
    }
    return null;
  }, [
    reportable,
    selectedUserId,
    paramUserId,
    params.reportedUserName,
    params.reportedUserProfileImageUrl,
  ]);

  const trimmedDetail = detail.trim();
  const otherNeedsDetail =
    selectedReason === "OTHER" && trimmedDetail.length === 0;
  const canSubmit =
    !reportMutation.isPending &&
    selectedUserId != null &&
    selectedReason != null &&
    !otherNeedsDetail;

  const handleSubmit = async () => {
    if (!canSubmit || selectedUserId == null || selectedReason == null) return;
    setErrorText(null);
    try {
      await reportMutation.mutateAsync({
        roomId,
        reportedUserId: selectedUserId,
        reason: selectedReason,
        otherReason: trimmedDetail.length > 0 ? trimmedDetail : null,
      });
      if (router.canGoBack()) router.back();
      else router.replace(`/topicroom/${roomId}` as const);
    } catch {
      setErrorText("신고 접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerSide}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Image source={backIcon} style={styles.icon24} contentFit="contain" />
        </Pressable>
        <Text style={styles.headerTitle}>신고하기</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={styles.headerSide}
          hitSlop={8}
          accessibilityRole="button"
        >
          {reportMutation.isPending ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Text
              style={[
                styles.headerDone,
                !canSubmit && styles.headerDoneDisabled,
              ]}
            >
              완료
            </Text>
          )}
        </Pressable>
      </View>

      {/* Notice block */}
      <View style={styles.notice}>
        {NOTICE_BULLETS.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>{"•"}</Text>
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 신고 대상 */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>신고 대상</Text>
            <Text style={styles.sectionSubtitle}>
              신고할 유저를 선택해주세요
            </Text>
          </View>

          <Pressable
            style={styles.dropdown}
            onPress={() => setPickerOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: pickerOpen }}
          >
            <View style={styles.dropdownLeft}>
              {selectedDisplay ? (
                <>
                  <Image
                    source={
                      selectedDisplay.profileImageUrl
                        ? { uri: selectedDisplay.profileImageUrl }
                        : profileDefault
                    }
                    style={styles.avatar24}
                    contentFit={
                      selectedDisplay.profileImageUrl ? "cover" : "contain"
                    }
                  />
                  <Text style={styles.dropdownName} numberOfLines={1}>
                    {selectedDisplay.name}
                  </Text>
                </>
              ) : (
                <Text style={styles.dropdownPlaceholder}>
                  유저를 선택해주세요
                </Text>
              )}
            </View>
            <Image
              source={pickerOpen ? arrowUpIcon : arrowDownIcon}
              style={styles.icon24}
              contentFit="contain"
            />
          </Pressable>

          {pickerOpen ? (
            <View style={styles.pickerList}>
              {reportable.length === 0 ? (
                <Text style={styles.pickerEmpty}>
                  신고할 수 있는 다른 참여자가 없어요.
                </Text>
              ) : (
                reportable.map((m) => {
                  const active = m.userId === selectedUserId;
                  return (
                    <Pressable
                      key={m.userId}
                      style={({ pressed }) => [
                        styles.pickerRow,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        setSelectedUserId(m.userId);
                        setPickerOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Image
                        source={
                          m.profileImageUrl
                            ? { uri: m.profileImageUrl }
                            : profileDefault
                        }
                        style={styles.avatar24}
                        contentFit={m.profileImageUrl ? "cover" : "contain"}
                      />
                      <Text
                        style={[
                          styles.pickerName,
                          active && styles.pickerNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {m.nickName || "익명"}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}
        </View>

        {/* 신고 사유 */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>신고 사유</Text>
            <Text style={styles.sectionSubtitle}>
              구체적인 신고 사유를 선택해주세요
            </Text>
          </View>

          <View style={styles.reasonList}>
            {REPORT_REASONS.map((reason) => {
              const active = reason.value === selectedReason;
              return (
                <Pressable
                  key={reason.value}
                  style={({ pressed }) => [
                    styles.reasonRow,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      active && styles.radioOuterActive,
                    ]}
                  >
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
                </Pressable>
              );
            })}

            <View style={styles.detailBox}>
              <TextInput
                value={detail}
                onChangeText={(t) => setDetail(t.slice(0, DETAIL_MAX))}
                placeholder="신고 사유를 상세히 남겨 주세요"
                placeholderTextColor={Gray[300]}
                multiline
                maxLength={DETAIL_MAX}
                editable={!reportMutation.isPending}
                style={styles.detailInput}
              />
              <Text style={styles.detailCounter}>
                {detail.length}/{DETAIL_MAX}
              </Text>
            </View>
          </View>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.card },

  header: {
    height: undefined,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: C.card,
  },
  headerSide: {
    minWidth: 40,
    height: 24,
    justifyContent: "center",
  },
  icon24: { width: 24, height: 24 },
  headerTitle: {
    ...Typography.body1Medium,
    color: Gray[900],
  },
  headerDone: {
    ...Typography.body1Medium,
    color: C.primary,
    textAlign: "right",
  },
  headerDoneDisabled: {
    color: Gray[300],
  },

  notice: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: Gray[50],
    gap: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletDot: {
    ...Typography.caption1Medium,
    color: Gray[400],
    width: 14,
    lineHeight: 17,
  },
  bulletText: {
    ...Typography.caption1Medium,
    color: Gray[400],
    flex: 1,
  },

  scroll: {
    paddingTop: 28,
    gap: 28,
  },
  section: {
    paddingHorizontal: 16,
    gap: 20,
  },
  sectionHead: { gap: 8 },
  sectionTitle: {
    ...Typography.heading2,
    color: Gray[900],
  },
  sectionSubtitle: {
    ...Typography.body2Medium,
    color: Gray[500],
  },

  dropdown: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Gray[200],
    borderRadius: Radius.sm,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.card,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  avatar24: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Gray[100],
    overflow: "hidden",
  },
  dropdownName: {
    ...Typography.body2Bold,
    color: Gray[500],
    flexShrink: 1,
  },
  dropdownPlaceholder: {
    ...Typography.body2Medium,
    color: Gray[300],
  },

  pickerList: {
    borderWidth: 1,
    borderColor: Gray[200],
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
  },
  pickerName: {
    ...Typography.body2Medium,
    color: Gray[800],
    flexShrink: 1,
  },
  pickerNameActive: {
    color: C.primary,
  },
  pickerEmpty: {
    ...Typography.body2Medium,
    color: Gray[500],
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  reasonList: { gap: 24 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Magenta[300],
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Magenta[300],
  },
  reasonLabel: {
    ...Typography.body1Medium,
    color: Gray[900],
    flexShrink: 1,
  },

  detailBox: {
    height: 117,
    borderWidth: 1,
    borderColor: Gray[200],
    borderRadius: Radius.sm,
    padding: 16,
    justifyContent: "space-between",
  },
  detailInput: {
    flex: 1,
    ...Typography.body2Medium,
    color: Gray[900],
    paddingVertical: 0,
    textAlignVertical: "top",
  },
  detailCounter: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: "right",
  },

  errorText: {
    ...Typography.caption1Medium,
    color: C.error,
  },
  pressed: { opacity: 0.6 },
});
