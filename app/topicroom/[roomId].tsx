import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
  ConnectionStatusPill,
  LeaveConfirmModal,
  TopicRoomDdayBar,
  TopicRoomMenuDropdown,
  TopicRoomTopBar,
  formatTopicRoomSubtitle,
  useChatRoomMessagesInfinite,
  useLeaveTopicRoom,
  useTopicRoomMembers,
  useTopicRoomStomp,
  type DisplayMsg,
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
  const roomId = typeof params.roomId === "string" ? Number(params.roomId) : 0;

  const insets = useSafeAreaInsets();
  const myUserId = useProfileStore((s) => s.me?.userId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

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

  const {
    status,
    messages: realtimeMsgs,
    sendMessage,
  } = useTopicRoomStomp({ roomId });
  const membersQuery = useTopicRoomMembers(roomId);
  const members = membersQuery.data ?? [];
  const memberCount = members.length;
  const leaveMutation = useLeaveTopicRoom();

  const memberAvatarById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const m of members) map.set(m.userId, m.profileImageUrl ?? null);
    return map;
  }, [members]);

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

  const handleConfirmLeave = useCallback(() => {
    if (leaveMutation.isPending) return;
    leaveMutation.mutate(roomId, {
      onSuccess: () => {
        setLeaveConfirmOpen(false);
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)" as const);
      },
      onError: () => {
        setLeaveConfirmOpen(false);
        showToast("채팅방을 나가지 못했어요. 잠시 후 다시 시도해 주세요.");
      },
    });
  }, [leaveMutation, roomId, router, showToast]);

  // Report is now a full page (app/topicroom/report.tsx), not a bottom sheet.
  const goToReport = useCallback(
    (target?: {
      userId: number;
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
    if (sent) setInputText("");
  }, [sendMessage, inputText]);

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
    memberCount > 0
      ? memberCount
      : Number(params.activeUserNumber) ||
        cachedRoom?.activeUserNumber ||
        undefined;

  // First line: "웹툰 <상수리나무 아래>" when a works name exists; otherwise the
  // room name; only "채팅방 #id" as a true last resort. Second line is the room
  // name when the first line already shows the works.
  const hasWorks = !!worksName;
  const headerTitle = hasWorks
    ? formatTopicRoomSubtitle(worksType, worksName)
    : topicRoomName || `채팅방 #${roomId}`;
  const headerSubtitle = hasWorks ? topicRoomName || undefined : undefined;

  // Room-age / D-Day source. No room creation/join date is currently exposed by
  // the TopicRoom API (TopicRoomItem has no createdAt/joinedAt), so the bar only
  // renders if a startDate param is supplied. See report notes.
  const ddayStartDate = params.startDate ?? null;

  const onLongPressOther = useCallback(
    (msg: DisplayMsg) => {
      if (typeof msg.senderId !== "number") return;
      if (msg.senderId === myUserId) return;
      goToReport({
        userId: msg.senderId,
        userName: msg.senderName,
        profileImageUrl: msg.profileImageUrl,
      });
    },
    [myUserId, goToReport],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <TopicRoomTopBar
          topInset={insets.top}
          title={headerTitle}
          subtitle={headerSubtitle}
          memberCount={headerMemberCount}
          onBack={handleBack}
          onPressMenu={() => setMenuOpen(true)}
        />
      </View>

      <TopicRoomDdayBar startDate={ddayStartDate} />

      <ConnectionStatusPill status={status} />

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
          <ChatBubble msg={item} onLongPressOther={onLongPressOther} />
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

      <TopicRoomMenuDropdown
        visible={menuOpen}
        topOffset={headerHeight}
        onClose={() => setMenuOpen(false)}
        onPressReport={() => goToReport()}
        onPressLeave={handleLeave}
        leaveDisabled={leaveMutation.isPending}
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

      <Toast message={toastMessage} bottomOffset={insets.bottom + 80} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

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
