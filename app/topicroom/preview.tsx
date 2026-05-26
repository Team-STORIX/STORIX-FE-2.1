import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatTopicRoomSubtitle,
  useJoinTopicRoom,
  useTopicRoomInfoById,
} from "../../src/features/topicroom";
import { C, Radius, Typography } from "../../src/theme";

const backIcon = require("../../assets/icons/common/back.svg");

function firstParam(raw?: string | string[]) {
  return Array.isArray(raw) ? raw[0] : raw;
}

function worksTypeLabel(worksType?: string | null) {
  const raw = (worksType ?? "").trim();
  if (raw === "WEBTOON") return "웹툰";
  if (raw === "WEBNOVEL") return "웹소설";
  return raw || "작품";
}

export default function TopicRoomPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    roomId?: string;
    keyword?: string;
    topicRoomName?: string;
    worksName?: string;
    worksType?: string;
    activeUserNumber?: string;
    thumbnailUrl?: string;
    lastChatMessage?: string;
    lastChatTime?: string;
  }>();

  const roomId = Number(firstParam(params.roomId) ?? 0);
  const keyword = firstParam(params.keyword) ?? "";

  const paramTopicRoomName = firstParam(params.topicRoomName) ?? "";
  const paramWorksName = firstParam(params.worksName) ?? "";
  const paramWorksType = firstParam(params.worksType) ?? "";
  const paramActiveUser = firstParam(params.activeUserNumber);
  const paramThumbnail = firstParam(params.thumbnailUrl) ?? "";
  const paramLastChat = firstParam(params.lastChatMessage) ?? "";

  // Fallback: only fetch when core params are missing AND we have a keyword to
  // search with. useTopicRoomInfoById searches by keyword then matches roomId,
  // so without a keyword there is nothing to fetch — we never invent data.
  const needsFallback = !paramTopicRoomName || !paramWorksName;
  const infoQuery = useTopicRoomInfoById({
    keyword: needsFallback ? keyword : "",
    topicRoomId: roomId,
  });
  const fetched = infoQuery.data ?? null;

  const topicRoomName = paramTopicRoomName || fetched?.topicRoomName || "";
  const worksName = paramWorksName || fetched?.worksName || "";
  const worksType = paramWorksType || fetched?.worksType || "";
  const thumbnailUrl = paramThumbnail || fetched?.thumbnailUrl || "";
  const activeUserNumber =
    Number(paramActiveUser) || fetched?.activeUserNumber || 0;

  const worksTitle = useMemo(
    () => formatTopicRoomSubtitle(worksType, worksName),
    [worksType, worksName],
  );
  const typeTag = worksTypeLabel(worksType);
  const initial = (worksName || topicRoomName || "?").slice(0, 1).toUpperCase();

  const joinMutation = useJoinTopicRoom();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEnter = async () => {
    if (joinMutation.isPending || !roomId) return;
    setErrorMessage(null);
    try {
      // The hook treats a 409 (already joined) as success, so calling join
      // unconditionally is safe whether or not the user is already a member.
      await joinMutation.mutateAsync(roomId);
      router.replace({
        pathname: "/topicroom/[roomId]",
        params: {
          roomId: String(roomId),
          topicRoomName,
          worksName,
          worksType,
          activeUserNumber: String(activeUserNumber),
        },
      });
    } catch {
      setErrorMessage("토픽룸에 입장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Full-bleed works thumbnail / book cover */}
      <View style={styles.background}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Text style={styles.fallbackText}>{initial}</Text>
          </View>
        )}
        {/* Dark scrims for legibility (no gradient lib in project) */}
        <View style={styles.scrim} />
        <View style={styles.bottomScrim} />
      </View>

      {/* Header with back arrow */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>
      </View>

      {/* Bottom info block */}
      <View
        style={[
          styles.infoBlock,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        <View style={styles.tagRow}>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{typeTag}</Text>
          </View>
          <View style={styles.countTag}>
            <Text style={styles.countTagText}>
              {activeUserNumber}명이 대화 중
            </Text>
          </View>
        </View>

        <Text style={styles.worksTitle} numberOfLines={2}>
          {worksTitle}
        </Text>

        {topicRoomName ? (
          <Text style={styles.roomName} numberOfLines={1}>
            {topicRoomName}
          </Text>
        ) : null}

        {paramLastChat ? (
          <Text style={styles.lastChat} numberOfLines={1}>
            {paramLastChat}
          </Text>
        ) : null}
      </View>

      {/* Fixed entry button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        <Pressable
          style={({ pressed }) => [
            styles.enterButton,
            (joinMutation.isPending || !roomId) && styles.enterButtonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={handleEnter}
          disabled={joinMutation.isPending || !roomId}
          accessibilityRole="button"
        >
          {joinMutation.isPending ? (
            <ActivityIndicator size="small" color={C.card} />
          ) : (
            <Text style={styles.enterButtonText}>토픽룸 입장하기</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.text,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryMid,
  },
  fallbackText: {
    fontSize: 96,
    fontWeight: "800",
    color: C.card,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(19, 17, 18, 0.4)",
  },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    backgroundColor: "rgba(19, 17, 18, 0.45)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: C.card,
  },
  infoBlock: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    gap: 8,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeTag: {
    backgroundColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  typeTagText: {
    ...Typography.body2Bold,
    color: C.card,
  },
  countTag: {
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countTagText: {
    ...Typography.body2Bold,
    color: C.primary,
  },
  worksTitle: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 36,
    color: C.card,
  },
  roomName: {
    ...Typography.heading2,
    color: C.card,
  },
  lastChat: {
    ...Typography.body2Medium,
    color: C.divider,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  errorText: {
    ...Typography.caption1Medium,
    color: C.card,
    textAlign: "center",
  },
  enterButton: {
    height: 50,
    borderRadius: Radius.sm,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  enterButtonDisabled: {
    opacity: 0.6,
  },
  enterButtonText: {
    ...Typography.body1Bold,
    color: C.card,
  },
  pressed: {
    opacity: 0.85,
  },
});
