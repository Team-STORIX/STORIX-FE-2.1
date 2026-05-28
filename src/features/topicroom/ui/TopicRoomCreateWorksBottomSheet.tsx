import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, Gray, Magenta, Radius, S, Typography } from "../../../theme";
import type { WorksSearchItem } from "../../search/api/search.schema";
import { useWorksSearch } from "../../search/hooks/useSearch";
import { findTopicRoomIdByWorksName } from "../api/topicroom.api";
import { useJoinTopicRoom } from "../hooks/useJoinTopicRoom";

const cancelIcon = require("../../../../assets/icons/common/cancel.svg");
const searchIcon = require("../../../../assets/icons/common/search.svg");
const checkPinkIcon = require("../../../../assets/icons/common/check-pink.svg");
const checkGrayIcon = require("../../../../assets/icons/common/check-gray.svg");

export type PickedTopicRoomWorks = {
  worksId: number;
  worksName: string;
  thumbnailUrl?: string | null;
  artistName?: string | null;
  worksType?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdvance: (works: PickedTopicRoomWorks) => void;
  onEnterExisting: (roomId: number) => void;
};

export function TopicRoomCreateWorksBottomSheet({
  visible,
  onClose,
  onAdvance,
  onEnterExisting,
}: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [existingRoomId, setExistingRoomId] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const checkSeqRef = useRef(0);

  const joinMutation = useJoinTopicRoom();

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    setKeyword("");
    setDebouncedKeyword("");
    setSelectedId(undefined);
    setExistingRoomId(null);
    setChecking(false);

    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword, visible]);

  const worksQuery = useWorksSearch({
    keyword: debouncedKeyword,
    page: 0,
  });

  const works: WorksSearchItem[] = useMemo(
    () => worksQuery.data?.result.content ?? [],
    [worksQuery.data?.result.content],
  );

  const selectedWork = useMemo(
    () => works.find((w) => w.worksId === selectedId) ?? null,
    [selectedId, works],
  );

  const runExistingCheck = (item: WorksSearchItem) => {
    const seq = ++checkSeqRef.current;
    setChecking(true);
    setExistingRoomId(null);
    void (async () => {
      try {
        const found = await findTopicRoomIdByWorksName(item.worksName);
        if (seq !== checkSeqRef.current) return;
        setExistingRoomId(found ?? null);
      } finally {
        if (seq === checkSeqRef.current) setChecking(false);
      }
    })();
  };

  const handleToggleSelect = (item: WorksSearchItem) => {
    if (joinMutation.isPending) return;
    if (selectedId === item.worksId) {
      checkSeqRef.current += 1;
      setSelectedId(undefined);
      setExistingRoomId(null);
      setChecking(false);
      return;
    }
    setSelectedId(item.worksId);
    runExistingCheck(item);
  };

  const handleClose = (after?: () => void) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
        after?.();
      }
    });
  };

  const handleConfirm = () => {
    if (!selectedWork) return;
    if (checking || joinMutation.isPending) return;

    if (existingRoomId != null) {
      joinMutation.mutate(existingRoomId, {
        onSuccess: () => {
          handleClose(() => onEnterExisting(existingRoomId));
        },
      });
      return;
    }

    const picked: PickedTopicRoomWorks = {
      worksId: Number(selectedWork.worksId),
      worksName: selectedWork.worksName,
      thumbnailUrl: selectedWork.thumbnailUrl ?? null,
      artistName: selectedWork.artistName ?? null,
      worksType: selectedWork.worksType ?? null,
    };
    handleClose(() => onAdvance(picked));
  };

  if (!visible) return null;

  const buttonState: "idle" | "next" | "enter" | "checking" | "joining" =
    joinMutation.isPending
      ? "joining"
      : !selectedWork
        ? "idle"
        : checking
          ? "checking"
          : existingRoomId != null
            ? "enter"
            : "next";

  const buttonLabel =
    buttonState === "idle"
      ? "다음으로"
      : buttonState === "enter" || buttonState === "joining"
        ? "토픽룸으로 이동하기"
        : "다음으로";

  const buttonDisabled =
    buttonState === "idle" ||
    buttonState === "checking" ||
    buttonState === "joining";
  const buttonBusy = buttonState === "checking" || buttonState === "joining";

  return (
    <Modal
      transparent
      animationType="none"
      visible
      onRequestClose={() => handleClose()}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => {
            if (joinMutation.isPending) return;
            handleClose();
          }}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 18,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardWrap}
          >
            <View style={styles.header}>
              <Text style={styles.title}>작품선택</Text>
              <Pressable
                onPress={() => handleClose()}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="닫기"
              >
                <Image
                  source={cancelIcon}
                  style={styles.closeIcon}
                  contentFit="contain"
                />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <TextInput
                value={keyword}
                onChangeText={setKeyword}
                placeholder="토픽룸을 생성하고 싶은 작품을 검색하세요"
                placeholderTextColor={C.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                editable={!joinMutation.isPending}
              />
              {keyword.length > 0 ? (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => {
                    setKeyword("");
                    setSelectedId(undefined);
                    setExistingRoomId(null);
                    setChecking(false);
                    checkSeqRef.current += 1;
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="검색어 지우기"
                >
                  <Image
                    source={cancelIcon}
                    style={styles.clearIcon}
                    contentFit="contain"
                  />
                </Pressable>
              ) : (
                <Image
                  source={searchIcon}
                  style={styles.searchFieldIcon}
                  contentFit="contain"
                />
              )}
            </View>

            <View style={styles.listWrap}>
              {!debouncedKeyword ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateText}></Text>
                </View>
              ) : worksQuery.isLoading ? (
                <View style={styles.stateWrap}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : worksQuery.isError ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateText}>검색에 실패했어요</Text>
                </View>
              ) : works.length === 0 ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateText}>검색 결과가 없습니다</Text>
                </View>
              ) : (
                <FlatList
                  data={works}
                  keyExtractor={(item) => String(item.worksId)}
                  renderItem={({ item }) => (
                    <WorksItemRow
                      item={item}
                      selected={item.worksId === selectedId}
                      hasExistingRoom={
                        item.worksId === selectedId && existingRoomId != null
                      }
                      onPress={() => handleToggleSelect(item)}
                    />
                  )}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </View>

            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  buttonState === "enter" && styles.primaryButtonEnter,
                  buttonDisabled && styles.primaryButtonDisabled,
                  pressed && !buttonDisabled && styles.pressed,
                ]}
                onPress={handleConfirm}
                disabled={buttonDisabled}
                accessibilityRole="button"
              >
                {buttonBusy ? (
                  <ActivityIndicator size="small" color={C.card} />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      buttonDisabled && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    {buttonLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function WorksItemRow({
  item,
  selected,
  hasExistingRoom,
  onPress,
}: {
  item: WorksSearchItem;
  selected: boolean;
  hasExistingRoom: boolean;
  onPress: () => void;
}) {
  const meta = [item.artistName, item.worksType].filter(Boolean).join(" · ");
  return (
    <Pressable
      style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={selected ? { selected: true } : {}}
    >
      <View style={styles.itemThumbWrap}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.itemThumb}
            contentFit="cover"
          />
        ) : null}
      </View>

      <View style={styles.itemTextWrap}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.worksName ?? "작품"}
        </Text>
        {meta ? (
          <Text style={styles.itemMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {hasExistingRoom ? (
          <Text style={styles.existingRoomText}>이미 토픽룸이 있습니다</Text>
        ) : null}
      </View>

      <Image
        source={selected ? checkPinkIcon : checkGrayIcon}
        style={styles.selectIcon}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    height: "80%",
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: C.card,
    paddingHorizontal: S.cardPad,
  },
  keyboardWrap: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 28,
    paddingBottom: 28,
  },
  title: { ...Typography.heading2, color: C.text },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { width: 20, height: 20 },

  searchWrap: {
    marginBottom: 16,
    justifyContent: "center",
  },
  searchInput: {
    borderRadius: Radius.md,
    backgroundColor: Gray[50],
    paddingLeft: 16,
    paddingRight: 44,
    paddingVertical: 14,
    color: C.text,
    ...Typography.body2Medium,
  },
  searchFieldIcon: {
    position: "absolute",
    right: 16,
    width: 20,
    height: 20,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  clearIcon: { width: 16, height: 16 },

  listWrap: { flex: 1 },
  listContent: { paddingBottom: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    borderRadius: Radius.sm,
  },
  itemThumbWrap: {
    width: 87,
    height: 116,
    borderRadius: Radius.xs,
    overflow: "hidden",
    backgroundColor: Gray[100],
  },
  itemThumb: { width: 87, height: 116 },
  itemTextWrap: { flex: 1, minWidth: 0 },
  itemTitle: { ...Typography.body1Semibold, color: C.text },
  itemMeta: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    marginTop: 2,
  },
  existingRoomText: {
    ...Typography.caption1Semibold,
    color: C.error,
    marginTop: 2,
  },
  selectIcon: { width: 24, height: 24 },

  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  stateText: { ...Typography.body2Medium, color: C.textMuted },

  footer: { paddingTop: 16 },
  primaryButton: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonEnter: {
    backgroundColor: Magenta[300],
  },
  primaryButtonDisabled: {
    backgroundColor: C.divider,
  },
  primaryButtonText: { ...Typography.body1Medium, color: C.card },
  primaryButtonTextDisabled: { color: C.textMuted },
  pressed: { opacity: 0.85 },
});
