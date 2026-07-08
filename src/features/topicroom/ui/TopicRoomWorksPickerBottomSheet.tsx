import { Image } from "expo-image";
import { useRouter } from "expo-router";
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
import { C, Gray, Radius, S, Typography } from "../../../theme";
import { useRecommendedHashtags } from "../../feed/hooks/hashtag";
import { SearchEmptyState } from "../../search";
import type { WorksSearchItem } from "../../search/api/search.schema";
import { useWorksSearch } from "../../search/hooks/useSearch";
import { findTopicRoomIdByWorksName } from "../api/topicroom.api";
import { useJoinTopicRoom } from "../hooks";
import { isTopicRoomParticipationLimitError } from "../services/topicRoomLimit";
import { TopicRoomLimitModal } from "./TopicRoomLimitModal";

const checkPinkIcon = require("../../../../assets/icons/common/check-pink.svg");
const checkGrayIcon = require("../../../../assets/icons/common/check-gray.svg");
const cancelIcon = require("../../../../assets/icons/common/cancel.svg");
const searchIcon = require("../../../../assets/icons/common/search.svg");
const searchCancelIcon = require("../../../../assets/icons/plus/icon-search-cancle.svg");

export type PickedWorks = {
  worksId: number;
  worksName: string;
  thumbnailUrl?: string | null;
  artistName?: string | null;
  worksType?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPickWork: (work: PickedWorks) => void;
};

function WorkResultItem({
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
  const summary = [item.artistName, item.worksType].filter(Boolean).join(" · ");

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
        ) : (
          <View style={styles.itemThumbFallback}>
            <Text style={styles.itemThumbFallbackText}>
              {(item.worksName ?? "").trim().charAt(0) || "?"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemTextWrap}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.worksName ?? "작품"}
        </Text>
        {summary ? (
          <Text style={styles.itemSummary} numberOfLines={1}>
            {summary}
          </Text>
        ) : null}
        {selected && hasExistingRoom ? (
          <Text style={styles.itemExisting}>이미 토픽룸이 있습니다</Text>
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

export function TopicRoomWorksPickerBottomSheet({
  visible,
  onClose,
  onPickWork,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [existingRoomId, setExistingRoomId] = useState<number | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
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
    setCheckingExisting(false);
    checkSeqRef.current += 1;

    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  useEffect(() => {
    if (!visible) return;

    const timeout = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [keyword, visible]);

  const searchQuery = useWorksSearch({ keyword: debouncedKeyword, page: 0 });

  const works = useMemo<WorksSearchItem[]>(
    () => searchQuery.data?.result.content ?? [],
    [searchQuery.data?.result.content],
  );

  const selectedWork = useMemo(
    () => works.find((item) => item.worksId === selectedId) ?? null,
    [selectedId, works],
  );

  const recommendedHashtagsQuery = useRecommendedHashtags();
  const recommendationKeyword =
    recommendedHashtagsQuery.data?.find(
      (item) => item.name.trim().length > 0,
    )?.name ?? null;

  const runExistingCheck = (item: WorksSearchItem) => {
    const seq = ++checkSeqRef.current;
    setCheckingExisting(true);
    setExistingRoomId(null);
    void (async () => {
      try {
        const found = await findTopicRoomIdByWorksName(item.worksName);
        if (seq !== checkSeqRef.current) return;
        setExistingRoomId(found ?? null);
      } finally {
        if (seq === checkSeqRef.current) setCheckingExisting(false);
      }
    })();
  };

  const handleSelectWork = (item: WorksSearchItem) => {
    if (joinMutation.isPending) return;
    if (selectedId === item.worksId) {
      checkSeqRef.current += 1;
      setSelectedId(undefined);
      setExistingRoomId(null);
      setCheckingExisting(false);
      return;
    }
    setSelectedId(item.worksId);
    runExistingCheck(item);
  };

  const animateOut = (afterClose?: () => void) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) afterClose?.();
    });
  };

  const handleConfirm = () => {
    if (!selectedWork || checkingExisting || joinMutation.isPending) return;

    if (existingRoomId != null) {
      const roomId = existingRoomId;
      joinMutation.mutate(roomId, {
        onSuccess: () => {
          animateOut(() => {
            router.replace(`/topicroom/${roomId}` as const);
          });
        },
        onError: (err) => {
          if (isTopicRoomParticipationLimitError(err)) {
            setLimitModalVisible(true);
          }
        },
      });
      return;
    }

    const picked: PickedWorks = {
      worksId: Number(selectedWork.worksId),
      worksName: selectedWork.worksName,
      thumbnailUrl: selectedWork.thumbnailUrl ?? null,
      artistName: selectedWork.artistName ?? null,
      worksType: selectedWork.worksType ?? null,
    };
    animateOut(() => onPickWork(picked));
  };

  const canConfirm =
    selectedWork != null && !checkingExisting && !joinMutation.isPending;
  const isBusy = checkingExisting || joinMutation.isPending;
  const goToExistingRoom = existingRoomId != null;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="none"
      visible
      onRequestClose={() => animateOut(onClose)}
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
          onPress={() => animateOut(onClose)}
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
                onPress={() => animateOut(onClose)}
                style={styles.closeButton}
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
                placeholder="토픽룸을 생성하고 싶은 작품을 선택하세요"
                placeholderTextColor={C.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {keyword.length > 0 ? (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => {
                    setKeyword("");
                    setSelectedId(undefined);
                    setExistingRoomId(null);
                    setCheckingExisting(false);
                    checkSeqRef.current += 1;
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="검색어 지우기"
                >
                  <Image
                    source={searchCancelIcon}
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
                <View style={styles.stateWrap} />
              ) : searchQuery.isLoading ? (
                <View style={styles.stateWrap}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : searchQuery.isError || works.length === 0 ? (
                <SearchEmptyState
                  recommendationKeyword={recommendationKeyword}
                  onPressRecommendation={setKeyword}
                />
              ) : (
                <FlatList
                  data={works}
                  keyExtractor={(item) => String(item.worksId)}
                  renderItem={({ item }) => (
                    <WorkResultItem
                      item={item}
                      selected={item.worksId === selectedId}
                      hasExistingRoom={goToExistingRoom}
                      onPress={() => handleSelectWork(item)}
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
                onPress={handleConfirm}
                disabled={!canConfirm}
                style={({ pressed }) => [
                  styles.primaryButton,
                  goToExistingRoom
                    ? styles.primaryButtonMagenta
                    : canConfirm
                      ? styles.primaryButtonActive
                      : styles.primaryButtonDisabled,
                  pressed && canConfirm && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={C.card} />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      !canConfirm && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    {goToExistingRoom ? "토픽룸으로 이동하기" : "다음으로"}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>

      <TopicRoomLimitModal
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    height: "80%",
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: C.card,
    paddingHorizontal: S.screenH,
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  searchWrap: {
    marginBottom: 16,
    justifyContent: "center",
  },
  searchInput: {
    borderRadius: Radius.sm,
    paddingLeft: 16,
    paddingRight: 44,
    paddingVertical: 14,
    color: C.text,
    ...Typography.body2Medium,
    backgroundColor: Gray[50],
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
  clearIcon: {
    width: 18,
    height: 18,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  itemThumbWrap: {
    width: 87,
    height: 116,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Gray[100],
  },
  itemThumb: {
    width: 87,
    height: 116,
  },
  itemThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryLight,
  },
  itemThumbFallbackText: {
    ...Typography.body1Bold,
    color: C.primary,
  },
  itemTextWrap: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  itemSummary: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },
  itemExisting: {
    ...Typography.caption1Medium,
    color: C.liked,
  },
  selectIcon: {
    width: 24,
    height: 24,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  footer: {
    paddingTop: 14,
  },
  primaryButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
  },
  primaryButtonActive: {
    backgroundColor: Gray[900],
  },
  primaryButtonMagenta: {
    backgroundColor: C.primary,
  },
  primaryButtonDisabled: {
    backgroundColor: Gray[200],
  },
  primaryButtonText: {
    ...Typography.body1Semibold,
    color: C.card,
  },
  primaryButtonTextDisabled: {
    color: Gray[500],
  },
  pressed: {
    opacity: 0.75,
  },
});
