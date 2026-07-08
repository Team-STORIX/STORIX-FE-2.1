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
import { C, Gray, Magenta } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { S } from "../../../theme/spacing";
import { Typography } from "../../../theme/typography";
import type { PlusWorksSearchItem } from "../api";
import { usePlusWorksSearch } from "../hooks";

const cancelIcon = require("../../../../assets/icons/common/cancel.svg");
const searchIcon = require("../../../../assets/icons/common/search.svg");
const clearSearchIcon = require("../../../../assets/icons/plus/icon-search-cancle.svg");
const warningIcon = require("../../../../assets/icons/search/warning.png");
const checkPinkIcon = require("../../../../assets/icons/common/check-pink.svg");
const checkGrayIcon = require("../../../../assets/icons/common/check-gray.svg");

export type PickedFeedWork = {
  id: number;
  title: string;
  artistName: string;
  worksType: string;
  genre: string;
  hashtags: string[];
  meta: string;
  thumb: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (work: PickedFeedWork) => void;
};

function WorkItemRow({
  item,
  selected,
  onPress,
}: {
  item: PlusWorksSearchItem;
  selected: boolean;
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
      </View>

      <Image
        source={selected ? checkPinkIcon : checkGrayIcon}
        style={styles.selectIcon}
        contentFit="contain"
      />
    </Pressable>
  );
}

export function FeedWritePickerBottomSheet({
  visible,
  onClose,
  onPick,
}: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedWorkId, setSelectedWorkId] = useState<number | undefined>();

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }

    setKeyword("");
    setDebouncedKeyword("");
    setSelectedWorkId(undefined);

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

  const searchQuery = usePlusWorksSearch({
    keyword: debouncedKeyword,
    size: 20,
  });

  const works = useMemo(
    () => searchQuery.data?.pages.flatMap((page) => page.result.content) ?? [],
    [searchQuery.data?.pages],
  );

  const selectedWork = useMemo(
    () => works.find((w) => w.worksId === selectedWorkId),
    [selectedWorkId, works],
  );
  const recommendedKeyword = "로맨스";

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

  if (!visible) return null;

  const onConfirm = () => {
    if (!selectedWork) return;
    const picked: PickedFeedWork = {
      id: Number(selectedWork.worksId),
      title: selectedWork.worksName ?? "",
      artistName: selectedWork.artistName ?? "",
      worksType: selectedWork.worksType ?? "",
      genre: selectedWork.genre ?? "",
      hashtags: selectedWork.hashtags ?? [],
      meta: [selectedWork.artistName, selectedWork.worksType]
        .filter(Boolean)
        .join(" · "),
      thumb: selectedWork.thumbnailUrl ?? "",
    };
    handleClose(() => onPick(picked));
  };

  const showEmptyState =
    !!debouncedKeyword &&
    !searchQuery.isLoading &&
    !searchQuery.isError &&
    works.length === 0;

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
          onPress={() => handleClose()}
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
                placeholder="함께 이야기하고 싶은 작품을 검색하세요"
                placeholderTextColor={Gray[400]}
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
                    setSelectedWorkId(undefined);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="검색어 지우기"
                >
                  <Image
                    source={clearSearchIcon}
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
                  <Text style={styles.stateText}>검색어를 입력하세요</Text>
                </View>
              ) : searchQuery.isLoading ? (
                <View style={styles.stateWrap}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : searchQuery.isError ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateText}>검색에 실패했어요</Text>
                </View>
              ) : showEmptyState ? (
                <View style={styles.emptyListSpace} />
              ) : (
                <FlatList
                  data={works}
                  keyExtractor={(item) => String(item.worksId)}
                  renderItem={({ item }) => (
                    <WorkItemRow
                      item={item}
                      selected={item.worksId === selectedWorkId}
                      onPress={() =>
                        setSelectedWorkId((curr) =>
                          curr === item.worksId ? undefined : item.worksId,
                        )
                      }
                    />
                  )}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onEndReachedThreshold={0.5}
                  onEndReached={() => {
                    if (
                      searchQuery.hasNextPage &&
                      !searchQuery.isFetchingNextPage
                    ) {
                      void searchQuery.fetchNextPage();
                    }
                  }}
                  ListFooterComponent={
                    searchQuery.isFetchingNextPage ? (
                      <ActivityIndicator
                        size="small"
                        color={C.primary}
                        style={styles.nextPageLoader}
                      />
                    ) : null
                  }
                />
              )}
            </View>

            {selectedWork ? (
              <View style={styles.footer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={onConfirm}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>
                    선택 작품 게시글 쓰기
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </KeyboardAvoidingView>

          {showEmptyState ? (
            <View pointerEvents="box-none" style={styles.emptyStateLayer}>
              <Image
                source={warningIcon}
                style={styles.emptyIcon}
                contentFit="contain"
              />
              <View style={styles.emptyTextGroup}>
                <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
                <Text style={styles.emptyDescription}>
                  이런 검색어는 어때요?
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setKeyword(recommendedKeyword);
                  setSelectedWorkId(undefined);
                }}
                style={({ pressed }) => [
                  styles.recommendChip,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${recommendedKeyword} 검색하기`}
              >
                <Image
                  source={searchIcon}
                  style={styles.recommendIcon}
                  contentFit="contain"
                />
                <Text style={styles.recommendText}>{recommendedKeyword}</Text>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    height: 742,
    maxHeight: "88%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: C.card,
    paddingHorizontal: S.cardPad,
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 28,
    paddingBottom: 28,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
    paddingLeft: 4,
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
    height: 47,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Gray[50],
    backgroundColor: Gray[50],
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    margin: 0,
    color: C.text,
    ...Typography.body1Medium,
    fontFamily: undefined,
  },
  searchFieldIcon: {
    width: 24,
    height: 24,
  },
  clearButton: {
    width: 18,
    height: 18,
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
    padding: 8,
    borderRadius: Radius.sm,
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
  itemTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  itemMeta: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    marginTop: 2,
  },
  selectIcon: {
    width: 24,
    height: 24,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  stateText: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  emptyListSpace: {
    flex: 1,
  },
  emptyStateLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
  },
  emptyTextGroup: {
    alignItems: "center",
    gap: 5,
  },
  emptyTitle: {
    ...Typography.heading2,
    color: C.text,
    textAlign: "center",
  },
  emptyDescription: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: "center",
  },
  recommendChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Magenta[100],
    backgroundColor: Magenta[20],
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
  },
  recommendIcon: {
    width: 24,
    height: 24,
    tintColor: Magenta[300],
  },
  recommendText: {
    ...Typography.caption1Medium,
    color: Magenta[300],
  },
  nextPageLoader: {
    marginVertical: 16,
  },
  footer: {
    paddingTop: 16,
  },
  primaryButton: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  pressed: {
    opacity: 0.85,
  },
});
