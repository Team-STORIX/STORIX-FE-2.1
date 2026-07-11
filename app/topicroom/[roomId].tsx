import { useQueryClient } from "@tanstack/react-query";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
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
  useMyTopicRoomsAll,
  useReportTopicRoomUser,
  useTopicRoomMembers,
  useTopicRoomStomp,
  type ConfirmVariant,
  type DisplayMsg,
  type KebabAnchor,
  type TopicRoomActionTarget,
  type TopicRoomItem,
} from "../../src/features/topicroom";
import { C } from "../../src/theme/colors";

const checkboxActiveIcon = require("../../assets/topicroom/icon-checkbox-active.svg");

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
        : Array.isArray((data as any)?.content)
          ? (data as any).content
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
  report: "신고가 정상적으로 완료됐어요.",
  block: "차단이 정상적으로 완료됐어요.",
} as const;

const ANDROID_MODAL_SWITCH_DELAY_MS = 250;

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
  const [dropdownAnchor, setDropdownAnchor] = useState<KebabAnchor | null>(
    null,
  );
  const [confirmVariant, setConfirmVariant] = useState<ConfirmVariant | null>(
    null,
  );
  const [reportSource, setReportSource] = useState<
    "profile" | "message" | null
  >(null);
  const confirmOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const blockMutation = useBlockTopicRoomUser();
  const reportMutation = useReportTopicRoomUser();

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
  const myRoomsQuery = useMyTopicRoomsAll({
    enabled: Number.isFinite(roomId) && roomId > 0,
    size: 20,
  });
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

  const handleActiveUserNumber = useCallback((activeUserNumber: number) => {
    if (activeUserNumber >= 0) setLiveMemberCount(activeUserNumber);
  }, []);

  const {
    status,
    messages: realtimeMsgs,
    sendMessage,
    disconnect: disconnectStomp,
  } = useTopicRoomStomp({
    roomId,
    enabled: isScreenFocused,
    onMemberChange: handleMemberChange,
    onActiveUserNumber: handleActiveUserNumber,
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

  const historyActiveUserNumber =
    historyData?.pages?.find(
      (page) => typeof page.activeUserNumber === "number",
    )?.activeUserNumber ?? null;

  useEffect(() => {
    if (
      typeof historyActiveUserNumber === "number" &&
      historyActiveUserNumber >= 0
    ) {
      setLiveMemberCount(historyActiveUserNumber);
    }
  }, [historyActiveUserNumber]);

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

  const joinedRoom = useMemo(
    () =>
      (myRoomsQuery.data ?? []).find((room) => room.topicRoomId === roomId) ??
      null,
    [myRoomsQuery.data, roomId],
  );

  const joinedRoomFromCache = queryClient.getQueryData<TopicRoomItem>([
    "topicroom",
    "room",
    roomId,
  ]);

  // Header metadata priority: route params → joined-room query → cached list query → fallback.
  const cachedRoom = useMemo(
    () =>
      joinedRoomFromCache ??
      joinedRoom ??
      findCachedTopicRoom(
        queryClient.getQueriesData<unknown>({ queryKey: ["topicroom"] }),
        roomId,
      ),
    [queryClient, roomId, members.length, joinedRoom, joinedRoomFromCache],
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
    : topicRoomName || "토픽룸";
  const headerSubtitle = hasWorks ? topicRoomName || undefined : undefined;

  // Room-age / D-Day source. The chat-history response now carries a display
  // label (`joinedDays`, e.g. "3일") rather than the exact membership timestamp.
  const joinedDays =
    historyData?.pages?.find((page) => page.joinedDays != null)?.joinedDays ??
    null;

  const closeUserActions = useCallback(() => {
    if (confirmOpenTimerRef.current) {
      clearTimeout(confirmOpenTimerRef.current);
      confirmOpenTimerRef.current = null;
    }
    setProfileActionVisible(false);
    setDropdownAnchor(null);
    setConfirmVariant(null);
    setActionTarget(null);
    setReportSource(null);
  }, []);

  useEffect(
    () => () => {
      if (confirmOpenTimerRef.current) {
        clearTimeout(confirmOpenTimerRef.current);
        confirmOpenTimerRef.current = null;
      }
    },
    [],
  );

  // Build a target only for a valid other user — self / unknown senders get no
  // report/block entry point (Part C).
  const targetFromMsg = useCallback(
    (
      msg: DisplayMsg,
      options?: { includeChatMessage?: boolean },
    ): TopicRoomActionTarget | null => {
      if (
        typeof msg.senderId !== "number" ||
        !Number.isFinite(msg.senderId) ||
        msg.senderId <= 0
      ) {
        return null;
      }
      if (msg.senderId === myUserId) return null;
      const chatMessageId =
        typeof msg.chatMessageId === "number" &&
        Number.isFinite(msg.chatMessageId) &&
        msg.chatMessageId > 0
          ? msg.chatMessageId
          : undefined;
      return {
        userId: msg.senderId,
        ...(options?.includeChatMessage && chatMessageId != null
          ? { chatMessageId }
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
      setReportSource("profile");
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
      setReportSource("message");
      setActionTarget(target);
      setDropdownAnchor(anchor);
    },
    [targetFromMsg],
  );

  // Siren / 신고하기 and block / 차단하기 both suspend the originating overlay
  // and open the matching confirmation popup against the same target.
  const handleOpenReportConfirm = useCallback(() => {
    const isChatMessageReport =
      reportSource === "message" && actionTarget?.chatMessageId != null;
    const payloadKeys = isChatMessageReport
      ? ["reportedUserId", "chatMessageId"]
      : ["reportedUserId", "reason"];

    if (__DEV__) {
      console.log("[topicroom][report] open-confirm", {
        roomId,
        source: reportSource,
        hasTarget: actionTarget != null,
        reportedUserId: actionTarget?.userId ?? null,
        chatMessageId: actionTarget?.chatMessageId ?? null,
        reason: isChatMessageReport ? null : "DEFAULT",
        reportType: isChatMessageReport ? "chat-message" : "user",
        payloadKeys,
      });
    }
    if (confirmOpenTimerRef.current) {
      clearTimeout(confirmOpenTimerRef.current);
      confirmOpenTimerRef.current = null;
    }
    setProfileActionVisible(false);
    setDropdownAnchor(null);

    const openConfirm = () => {
      confirmOpenTimerRef.current = null;
      setConfirmVariant("report");
    };

    if (Platform.OS === "android") {
      confirmOpenTimerRef.current = setTimeout(
        openConfirm,
        ANDROID_MODAL_SWITCH_DELAY_MS,
      );
      return;
    }

    openConfirm();
  }, [actionTarget, reportSource, roomId]);

  const handleOpenBlockConfirm = useCallback(() => {
    if (confirmOpenTimerRef.current) {
      clearTimeout(confirmOpenTimerRef.current);
      confirmOpenTimerRef.current = null;
    }
    setProfileActionVisible(false);
    setDropdownAnchor(null);
    const openConfirm = () => {
      confirmOpenTimerRef.current = null;
      setConfirmVariant("block");
    };

    if (Platform.OS === "android") {
      confirmOpenTimerRef.current = setTimeout(
        openConfirm,
        ANDROID_MODAL_SWITCH_DELAY_MS,
      );
      return;
    }

    openConfirm();
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (blockMutation.isPending || reportMutation.isPending) return;
    setConfirmVariant(null);
    setActionTarget(null);
  }, [blockMutation.isPending, reportMutation.isPending]);

  const handleConfirmAction = useCallback(() => {
    if (!actionTarget || !confirmVariant) return;

    if (confirmVariant === "report") {
      if (reportMutation.isPending) return;
      if (!Number.isFinite(roomId) || roomId <= 0) {
        closeUserActions();
        showToast("채팅방 정보를 확인할 수 없어요.");
        return;
      }

      const isChatMessageReport =
        reportSource === "message" && actionTarget.chatMessageId != null;
      const reportPayload = {
        roomId,
        reportedUserId: actionTarget.userId,
        ...(isChatMessageReport
          ? { chatMessageId: actionTarget.chatMessageId }
          : { reason: "DEFAULT" as const }),
      };

      if (__DEV__) {
        console.log("[topicroom][report] confirm-submit", {
          roomId,
          source: reportSource,
          reportedUserId: actionTarget.userId,
          chatMessageId: actionTarget.chatMessageId ?? null,
          reason: isChatMessageReport ? null : "DEFAULT",
          reportType: isChatMessageReport ? "chat-message" : "user",
          payloadKeys: Object.keys(reportPayload).filter(
            (key) => key !== "roomId",
          ),
        });
      }

      reportMutation.mutate(reportPayload, {
        onSuccess: () => {
          closeUserActions();
          showToast(USER_ACTION_SNACK.report);
        },
        onError: () => {
          closeUserActions();
          showToast("신고 접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
        },
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
    reportMutation,
    roomId,
    closeUserActions,
    showToast,
  ]);

  const isUserActionSuccessToast =
    toastMessage === USER_ACTION_SNACK.report ||
    toastMessage === USER_ACTION_SNACK.block;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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

      <TopicRoomDdayBar joinedDays={joinedDays} />

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
          isPending={
            confirmVariant === "report"
              ? reportMutation.isPending
              : blockMutation.isPending
          }
          onCancel={handleCancelConfirm}
          onConfirm={handleConfirmAction}
        />
      ) : null}

      <Toast
        message={toastMessage}
        bottomOffset={36}
        leadingIconSource={isUserActionSuccessToast ? checkboxActiveIcon : undefined}
        leadingIconSize={24}
        onClose={() => setToastMessage(null)}
      />
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
});
