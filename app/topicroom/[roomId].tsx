import { useQueryClient } from "@tanstack/react-query";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toast } from "../../src/components/common/Toast";
import { WarningEmptyState } from "../../src/components/common/WarningEmptyState";
import { useProfileStore } from "../../src/features/profile";
import {
  ChatBubble,
  ChatInput,
  LeaveConfirmModal,
  TopicRoomDdayBar,
  TopicRoomTopBar,
  TopicRoomUserActionDropdown,
  TopicRoomUserActionModal,
  TopicRoomUserConfirmModal,
  formatTopicRoomSubtitle,
  useBlockTopicRoomUser,
  useChatRoomMessagesInfinite,
  useLeaveTopicRoom,
  useTopicRoomMembers,
  useTopicRoomStomp,
  type ConfirmVariant,
  type DisplayMsg,
  type KebabAnchor,
  type TopicRoomActionTarget,
  type TopicRoomItem,
} from "../../src/features/topicroom";
import { C } from "../../src/theme/colors";

// Scans the React Query caches that hold TopicRoomItem lists (popular / me /
// today / search) for a room matching roomId, so the header can show real
// metadata even when the caller did not pass it as a route param.
function findCachedTopicRoom(
  entries: [unknown, unknown][],
  roomId: number,
): TopicRoomItem | null {
  for (const [, data] of entries) {
    const candidates: any[] = Array.isArray(data)
      ? data
      : (data as any)?.pages
        ? (data as any).pages.flatMap((p: any) => p?.content ?? [])
        : [];
    const hit = candidates.find(
      (it) => it && typeof it === "object" && it.topicRoomId === roomId,
    );
    if (hit) return hit as TopicRoomItem;
  }
  return null;
}

// Success snackbar copy for the user-specific report / block flows
// (Figma 9095:36505 / 9095:36642).
const USER_ACTION_SNACK = {
  report: "신고가 접수되었어요.",
  block: "차단이 완료되었어요.",
} as const;

const formatTime = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

export default function TopicRoomScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    topicRoomName?: string;
    worksName?: string;
    worksType?: string;
    activeUserNumber?: string;
    startDate?: string;
    // Set by the report page on successful submission so the chat shows the
    // report-complete snackbar after navigating back. Cleared once consumed.
    userActionToast?: string;
  }>();
  // useLocalSearchParams can yield a string or a string[]; normalize either to a
  // single number. Invalid values become NaN, which downstream guards (history
  // query, STOMP canConnect, the leave guard) all treat as "no room".
  const rawRoomId = params.roomId;
  const roomId = Number(Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId);

  const insets = useSafeAreaInsets();
  const myUserId = useProfileStore((s) => s.me?.userId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [liveMemberCount, setLiveMemberCount] = useState<number | null>(null);

  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  // User-specific report / block flow. A single shared target drives both entry
  // points (avatar modal + message kebab); only one overlay is visible at once.
  const [actionTarget, setActionTarget] =
    useState<TopicRoomActionTarget | null>(null);
  const [profileActionVisible, setProfileActionVisible] = useState(false);
  const [dropdownAnchor, setDropdownAnchor] = useState<KebabAnchor | null>(null);
  const [confirmVariant, setConfirmVariant] = useState<ConfirmVariant | null>(
    null,
  );
  const blockMutation = useBlockTopicRoomUser();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2400);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatRoomMessagesInfinite({ roomId });

  const membersQuery = useTopicRoomMembers(roomId);
  const members = membersQuery.data ?? [];
  const memberCount = members.length;
  const leaveMutation = useLeaveTopicRoom();

  const handleMemberChange = useCallback(
    (activeUserNumber?: number) => {
      if (typeof activeUserNumber === "number" && activeUserNumber >= 0) {
        setLiveMemberCount(activeUserNumber);
      }
      void queryClient.invalidateQueries({
        queryKey: ["topicroom", "members", roomId],
      });
      void queryClient.invalidateQueries({ queryKey: ["topicroom"] });
    },
    [queryClient, roomId],
  );

  const {
    status,
    messages: realtimeMsgs,
    sendMessage,
    disconnect: disconnectStomp,
  } = useTopicRoomStomp({
    roomId,
    enabled: isScreenFocused,
    onMemberChange: handleMemberChange,
  });

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      if (Number.isFinite(roomId) && roomId > 0) {
        void queryClient.invalidateQueries({
          queryKey: ["chat", "room", "messages", roomId],
        });
      }

      return () => {
        setIsScreenFocused(false);
        void disconnectStomp();
      };
    }, [disconnectStomp, queryClient, roomId]),
  );

  const memberAvatarById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const m of members) map.set(m.userId, m.profileImageUrl ?? null);
    return map;
  }, [members]);

  useEffect(() => {
    if (members.length > 0) setLiveMemberCount(members.length);
  }, [members.length]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)" as const);
  }, [router]);

  const handleLeave = useCallback(() => {
    if (leaveMutation.isPending) return;
    setLeaveConfirmOpen(true);
  }, [leaveMutation.isPending]);

  const handleConfirmLeave = useCallback(async () => {
    if (__DEV__) {
      console.log("[TOPICROOM_LEAVE] confirm", {
        rawRoomId,
        normalizedRoomId: roomId,
        isPending: leaveMutation.isPending,
      });
    }
    // Block duplicate confirm taps while the request is in flight.
    if (leaveMutation.isPending) return;

    // Never issue /topic-rooms/NaN/leave — bail out with feedback instead.
    if (!Number.isFinite(roomId) || roomId <= 0) {
      setLeaveConfirmOpen(false);
      showToast("채팅방 정보를 확인할 수 없어요.");
      return;
    }

    try {
      await leaveMutation.mutateAsync(roomId);
      // Only after a confirmed success: tear down overlays and replace (not
      // back/push) so direct-entry users can't return to the room they left.
      setLeaveConfirmOpen(false);
      router.replace("/(tabs)/feed?section=topicroom" as never);
    } catch (error: any) {
      if (__DEV__) {
        console.log("[TOPICROOM_LEAVE] error", {
          roomId,
          status: error?.response?.status,
          code: error?.response?.data?.code,
          message: error?.response?.data?.message,
        });
      }
      // Stay in the room; restore button state and surface feedback.
      setLeaveConfirmOpen(false);
      showToast("채팅방을 나가지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [rawRoomId, roomId, leaveMutation, router, showToast]);

  // Report is now a full page (app/topicroom/report.tsx), not a bottom sheet.
  const goToReport = useCallback(
    (target?: {
      userId: number;
      chatMessageId?: number;
      userName?: string;
      profileImageUrl?: string | null;
    }) => {
      router.push({
        pathname: "/topicroom/report",
        params: {
          roomId: String(roomId),
          ...(target
            ? {
                reportedUserId: String(target.userId),
                ...(target.chatMessageId != null
                  ? { chatMessageId: String(target.chatMessageId) }
                  : {}),
                reportedUserName: target.userName ?? "",
                reportedUserProfileImageUrl: target.profileImageUrl ?? "",
              }
            : {}),
        },
      });
    },
    [router, roomId],
  );

  const historyDisplay: DisplayMsg[] = useMemo(() => {
    if (!historyData?.pages) return [];
    return historyData.pages.flatMap((page) =>
      page.content.map((m) => ({
        key: `h_${m.id}`,
        chatMessageId: m.id,
        text: m.message,
        senderId: m.senderId,
        senderName: m.senderName,
        profileImageUrl: memberAvatarById.get(m.senderId) ?? null,
        time: formatTime(m.createdAt),
        isMe: m.senderId === myUserId,
      })),
    );
  }, [historyData, memberAvatarById, myUserId]);

  const realtimeDisplay: DisplayMsg[] = useMemo(
    () =>
      realtimeMsgs.map((m) => ({
        key: `rt_${m.id}`,
        chatMessageId: m.chatMessageId,
        text: m.text,
        senderId: m.senderId,
        senderName: m.userName ?? "",
        profileImageUrl:
          typeof m.senderId === "number"
            ? (memberAvatarById.get(m.senderId) ?? null)
            : null,
        time: m.time,
        isMe: m.type === "me",
      })),
    [memberAvatarById, realtimeMsgs],
  );

  const allMessages: DisplayMsg[] = useMemo(
    () => [...realtimeDisplay.slice().reverse(), ...historyDisplay],
    [realtimeDisplay, historyDisplay],
  );

  const handleSend = useCallback(() => {
    const sent = sendMessage(inputText.trim());
    if (sent) {
      setInputText("");
      void queryClient.invalidateQueries({
        queryKey: ["chat", "room", "messages", roomId],
        refetchType: "none",
      });
    }
  }, [inputText, queryClient, roomId, sendMessage]);

  const canSend = status === "open" && !!inputText.trim();

  // Header metadata priority: route params → cached list query → fallback.
  const cachedRoom = useMemo(
    () =>
      findCachedTopicRoom(
        queryClient.getQueriesData<unknown>({ queryKey: ["topicroom"] }),
        roomId,
      ),
    [queryClient, roomId, members.length],
  );

  const worksName = params.worksName || cachedRoom?.worksName || "";
  const worksType = params.worksType || cachedRoom?.worksType || "";
  const topicRoomName = params.topicRoomName || cachedRoom?.topicRoomName || "";

  const headerMemberCount =
    liveMemberCount != null
      ? liveMemberCount
      : memberCount > 0
      ? memberCount
      : Number(params.activeUserNumber) ||
        cachedRoom?.activeUserNumber ||
        undefined;

  // First line: "웹툰 <상수리나무 아래>" when a works name exists; otherwise the
  // room name. Second line is the room name when the first line already shows
  // the works.
  const hasWorks = !!worksName;
  const headerTitle = hasWorks
    ? formatTopicRoomSubtitle(worksType, worksName)
    : topicRoomName;
  const headerSubtitle = hasWorks ? topicRoomName || undefined : undefined;

  // Room-age / D-Day source. The chat-history response carries the membership
  // `joinedAt`. It rides on the wrapped page, so scan all loaded pages for the
  // first non-null value rather than assuming it sits on page[0] (defensive in
  // case the first page back is a legacy direct-page with no joinedAt). Prefer
  // joinedAt, fall back to a valid route param, then null. Never use
  // lastChatTime (last activity, not join) or "now".
  const historyJoinedAt =
    historyData?.pages?.find((page) => page.joinedAt != null)?.joinedAt ?? null;
  const validRouteStartDate =
    params.startDate && !Number.isNaN(Date.parse(params.startDate))
      ? params.startDate
      : null;
  const ddayStartDate = historyJoinedAt ?? validRouteStartDate ?? null;

  if (__DEV__) {
    console.log("[TOPICROOM_DATE] dday-source", {
      historyJoinedAt,
      routeStartDate: params.startDate ?? null,
      selectedStartDate: ddayStartDate,
    });
  }

  const closeUserActions = useCallback(() => {
    setProfileActionVisible(false);
    setDropdownAnchor(null);
    setConfirmVariant(null);
    setActionTarget(null);
  }, []);

  // Build a target only for a valid other user — self / unknown senders get no
  // report/block entry point (Part C).
  const targetFromMsg = useCallback(
    (
      msg: DisplayMsg,
      options?: { includeChatMessage?: boolean },
    ): TopicRoomActionTarget | null => {
      if (typeof msg.senderId !== "number") return null;
      if (msg.senderId === myUserId) return null;
      return {
        userId: msg.senderId,
        ...(options?.includeChatMessage && msg.chatMessageId != null
          ? { chatMessageId: msg.chatMessageId }
          : {}),
        nickname: msg.senderName,
        profileImageUrl: msg.profileImageUrl,
      };
    },
    [myUserId],
  );

  const handlePressAvatar = useCallback(
    (msg: DisplayMsg) => {
      const target = targetFromMsg(msg);
      if (!target) return;
      setConfirmVariant(null);
      setDropdownAnchor(null);
      setActionTarget(target);
      setProfileActionVisible(true);
    },
    [targetFromMsg],
  );

  const handlePressKebab = useCallback(
    (msg: DisplayMsg, anchor: KebabAnchor) => {
      const target = targetFromMsg(msg, { includeChatMessage: true });
      if (!target) return;
      setConfirmVariant(null);
      setProfileActionVisible(false);
      setActionTarget(target);
      setDropdownAnchor(anchor);
    },
    [targetFromMsg],
  );

  // Siren / 신고하기 and block / 차단하기 both suspend the originating overlay
  // and open the matching confirmation popup against the same target.
  const handleOpenReportConfirm = useCallback(() => {
    setProfileActionVisible(false);
    setDropdownAnchor(null);
    setConfirmVariant("report");
  }, []);

  const handleOpenBlockConfirm = useCallback(() => {
    setProfileActionVisible(false);
    setDropdownAnchor(null);
    setConfirmVariant("block");
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (blockMutation.isPending) return;
    setConfirmVariant(null);
    setActionTarget(null);
  }, [blockMutation.isPending]);

  const handleConfirmAction = useCallback(() => {
    if (!actionTarget || !confirmVariant) return;

    if (confirmVariant === "report") {
      // Reason selection is mandatory, so hand off to the existing report page
      // with the target prefilled; the snackbar fires on its return.
      const target = actionTarget;
      closeUserActions();
      goToReport({
        userId: target.userId,
        chatMessageId: target.chatMessageId,
        userName: target.nickname,
        profileImageUrl: target.profileImageUrl,
      });
      return;
    }

    if (blockMutation.isPending) return;
    blockMutation.mutate(
      { roomId, targetUserId: actionTarget.userId },
      {
        onSuccess: () => {
          closeUserActions();
          showToast(USER_ACTION_SNACK.block);
        },
        onError: () => {
          closeUserActions();
          showToast("차단하지 못했어요. 잠시 후 다시 시도해 주세요.");
        },
      },
    );
  }, [
    actionTarget,
    confirmVariant,
    blockMutation,
    roomId,
    goToReport,
    closeUserActions,
    showToast,
  ]);

  // Report page hands back `userActionToast=report` on success; show the
  // snackbar once and clear the param so it does not re-fire on re-render.
  useEffect(() => {
    if (params.userActionToast === "report") {
      showToast(USER_ACTION_SNACK.report);
      router.setParams({ userActionToast: "" });
    }
  }, [params.userActionToast, showToast, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View>
        <TopicRoomTopBar
          topInset={insets.top}
          title={headerTitle}
          subtitle={headerSubtitle}
          memberCount={headerMemberCount}
          onBack={handleBack}
          onPressExit={handleLeave}
        />
      </View>

      <TopicRoomDdayBar startDate={ddayStartDate} />

      {historyLoading && !historyData ? (
        <ActivityIndicator
          style={styles.centeredLoader}
          size="large"
          color={C.primary}
        />
      ) : null}

      {!historyLoading && historyError ? (
        <Text style={styles.errorText}>메시지 기록을 불러오지 못했습니다.</Text>
      ) : null}

      <FlatList
        inverted
        data={allMessages}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ChatBubble
            msg={item}
            onPressAvatar={handlePressAvatar}
            onPressKebab={handlePressKebab}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={styles.paginationLoader}
              size="small"
              color={C.primary}
            />
          ) : null
        }
        ListEmptyComponent={
          !historyLoading && !historyError ? (
            <WarningEmptyState
              description="아직 메시지가 없습니다. 첫 메시지를 보내보세요."
              iconSize={96}
              style={styles.chatEmpty}
            />
          ) : null
        }
      />

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        canSend={canSend}
      />

      <LeaveConfirmModal
        visible={leaveConfirmOpen}
        isPending={leaveMutation.isPending}
        onClose={() => {
          if (leaveMutation.isPending) return;
          setLeaveConfirmOpen(false);
        }}
        onConfirm={handleConfirmLeave}
      />

      <TopicRoomUserActionModal
        visible={profileActionVisible}
        target={actionTarget}
        onClose={closeUserActions}
        onReport={handleOpenReportConfirm}
        onBlock={handleOpenBlockConfirm}
      />

      <TopicRoomUserActionDropdown
        visible={dropdownAnchor != null}
        anchor={dropdownAnchor}
        onClose={closeUserActions}
        onReport={handleOpenReportConfirm}
        onBlock={handleOpenBlockConfirm}
      />

      {confirmVariant ? (
        <TopicRoomUserConfirmModal
          visible
          variant={confirmVariant}
          target={actionTarget}
          isPending={confirmVariant === "block" && blockMutation.isPending}
          onCancel={handleCancelConfirm}
          onConfirm={handleConfirmAction}
        />
      ) : null}

      <Toast message={toastMessage} bottomOffset={insets.bottom + 80} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.card },

  centeredLoader: { flex: 1, alignSelf: "center", marginTop: 40 },
  errorText: {
    color: C.error,
    textAlign: "center",
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
  },

  listContent: { paddingVertical: 12 },

  paginationLoader: { paddingVertical: 10 },

  chatEmpty: {
    paddingVertical: 56,
    transform: [{ scaleY: -1 }],
  },
});
