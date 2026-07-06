import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import Svg, {
  Defs,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import type { WorksSearchItem } from "../../src/features/search/api/search.schema";
import { useWorksSearch } from "../../src/features/search/hooks/useSearch";
import {
  findTopicRoomIdByWorksName,
  isTopicRoomParticipationLimitError,
  TopicRoomLimitModal,
  useCreateTopicRoom,
  useJoinTopicRoom,
} from "../../src/features/topicroom";
import { C, Gray, Magenta, Radius, Typography } from "../../src/theme";

const backIcon = require("../../assets/icons/common/back.svg");
const topicRoomGraphic = require("../../assets/topicroom/topicroom-graphic.png");

const TOPIC_NAME_PATTERN = /^[0-9A-Za-z가-힣 ]{2,10}$/;
const MAX_NAME_LENGTH = 10;
const COUNTER_MAX = 30;

type Params = {
  worksId?: string;
  worksName?: string;
  thumbnailUrl?: string;
  artistName?: string;
  worksType?: string;
};

type PickedWorks = {
  worksId: number;
  worksName: string;
  thumbnailUrl?: string | null;
  artistName?: string | null;
  worksType?: string | null;
};

function pickParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function WarningSmallIcon() {
  return (
    <Svg
      width={28}
      height={28}
      viewBox="0 0 100 100"
      fill="none"
      style={styles.warningIcon}
    >
      <Path
        d="M10.9357 89.1666C7.85434 89.1666 5.93011 85.8291 7.47397 83.1625L46.3695 15.9793C47.9102 13.3181 51.7523 13.3181 53.2929 15.9793L92.1885 83.1625C93.7323 85.8291 91.8081 89.1666 88.7268 89.1666H10.9357ZM49.8312 76.6666C51.0118 76.6666 52.0014 76.2673 52.8 75.4687C53.5986 74.6701 53.9979 73.6805 53.9979 72.4999C53.9979 71.3194 53.5986 70.3298 52.8 69.5312C52.0014 68.7326 51.0118 68.3333 49.8312 68.3333C48.6507 68.3333 47.6611 68.7326 46.8625 69.5312C46.0639 70.3298 45.6646 71.3194 45.6646 72.4999C45.6646 73.6805 46.0639 74.6701 46.8625 75.4687C47.6611 76.2673 48.6507 76.6666 49.8312 76.6666ZM45.6646 60.1666C45.6646 62.3758 47.4554 64.1666 49.6646 64.1666H49.9979C52.207 64.1666 53.9979 62.3758 53.9979 60.1666V47.3333C53.9979 45.1241 52.207 43.3333 49.9979 43.3333H49.6646C47.4554 43.3333 45.6646 45.1241 45.6646 47.3333V60.1666Z"
        fill={Magenta[300]}
      />
    </Svg>
  );
}

export default function TopicRoomCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();

  const worksIdRaw = pickParam(params.worksId);
  const paramWorksId = worksIdRaw ? Number(worksIdRaw) : NaN;
  const paramWorksName = pickParam(params.worksName) ?? "";
  const paramThumbnailUrl = pickParam(params.thumbnailUrl) ?? "";
  const paramWorks = useMemo<PickedWorks | null>(() => {
    if (!Number.isFinite(paramWorksId) || paramWorksId <= 0 || !paramWorksName) {
      return null;
    }
    return {
      worksId: paramWorksId,
      worksName: paramWorksName,
      thumbnailUrl: paramThumbnailUrl,
      artistName: pickParam(params.artistName) ?? "",
      worksType: pickParam(params.worksType) ?? "",
    };
  }, [
    paramThumbnailUrl,
    paramWorksId,
    paramWorksName,
    params.artistName,
    params.worksType,
  ]);

  const [name, setName] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [pickedWorks, setPickedWorks] = useState<PickedWorks | null>(paramWorks);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [existingRoomId, setExistingRoomId] = useState<number | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const checkSeqRef = useRef(0);

  const createMutation = useCreateTopicRoom();
  const joinMutation = useJoinTopicRoom();

  useEffect(() => {
    if (paramWorks) setPickedWorks(paramWorks);
  }, [paramWorks]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const worksSearchQuery = useWorksSearch({
    keyword: debouncedKeyword,
    page: 0,
  });

  const searchResults: WorksSearchItem[] = useMemo(
    () => worksSearchQuery.data?.result.content ?? [],
    [worksSearchQuery.data?.result.content],
  );

  const selectedWork = useMemo(
    () => searchResults.find((w) => w.worksId === selectedId) ?? null,
    [searchResults, selectedId],
  );

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

  const handleConfirmWork = () => {
    if (!selectedWork || checkingExisting || joinMutation.isPending) return;

    if (existingRoomId != null) {
      joinMutation.mutate(existingRoomId, {
        onSuccess: () => router.replace(`/topicroom/${existingRoomId}` as const),
        onError: (err) => {
          if (isTopicRoomParticipationLimitError(err)) {
            setLimitModalVisible(true);
          }
        },
      });
      return;
    }

    setPickedWorks({
      worksId: Number(selectedWork.worksId),
      worksName: selectedWork.worksName,
      thumbnailUrl: selectedWork.thumbnailUrl ?? null,
      artistName: selectedWork.artistName ?? null,
      worksType: selectedWork.worksType ?? null,
    });
  };

  const trimmed = name.trim();
  const helperOk = TOPIC_NAME_PATTERN.test(trimmed);
  const canCreate = !!pickedWorks && helperOk && !createMutation.isPending;

  const showHelperWarning = !helperOk;

  const goToFeedTopicRoom = () =>
    router.replace("/(tabs)/feed?section=topicroom" as never);

  const handleBack = () => {
    if (!paramWorks && pickedWorks) {
      setPickedWorks(null);
      return;
    }
    if (router.canGoBack()) router.back();
    else goToFeedTopicRoom();
  };

  // On the completion step the room is already created, so going "back"
  // must never return to the name-setting screen (which would invite a
  // duplicate creation). Always route to the Feed TopicRoom tab instead.
  const handleCompleteBack = () => {
    goToFeedTopicRoom();
  };

  const handleCreate = () => {
    if (!canCreate) return;
    createMutation.mutate(
      { worksId: pickedWorks.worksId, topicRoomName: trimmed },
      {
        onSuccess: (topicRoomId) => {
          setCreatedId(topicRoomId);
        },
        onError: (err) => {
          if (isTopicRoomParticipationLimitError(err)) {
            setLimitModalVisible(true);
          }
        },
      },
    );
  };

  const handleEnterRoom = () => {
    if (createdId == null) {
      goToFeedTopicRoom();
      return;
    }
    router.replace(`/topicroom/${createdId}` as const);
  };

  const initial = useMemo(
    () => (pickedWorks?.worksName || "?").slice(0, 1).toUpperCase(),
    [pickedWorks?.worksName],
  );

  if (createdId != null) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={handleCompleteBack}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            hitSlop={8}
          >
            <Image
              source={backIcon}
              style={styles.icon24}
              contentFit="contain"
            />
          </Pressable>
        </View>

        <View style={styles.completeIntro}>
          <Text style={styles.completeTitle}>첫 토픽룸이 만들어졌어요!</Text>
          <Text style={styles.completeSubtitle}>
            이제 토픽룸에서 자유롭게 이야기해 보아요!
          </Text>
        </View>

        <View style={styles.graphicWrap}>
          <Image
            source={topicRoomGraphic}
            style={styles.graphic}
            contentFit="contain"
          />
          <Svg
            style={styles.graphicFade}
            pointerEvents="none"
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgLinearGradient id="graphicFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={C.card} stopOpacity={0} />
                <Stop offset="1" stopColor={C.card} stopOpacity={1} />
              </SvgLinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#graphicFade)"
            />
          </Svg>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleEnterRoom}
            style={({ pressed }) => [
              styles.primaryBtn,
              styles.primaryBtnActiveMagenta,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>토픽룸으로 이동하기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleBack}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={8}
        >
          <Image source={backIcon} style={styles.icon24} contentFit="contain" />
        </Pressable>
      </View>

      {!pickedWorks ? (
        <>
          <View style={styles.pickIntro}>
            <Text style={styles.introTitle}>토픽룸을 만들 작품을 선택해주세요</Text>
            <Text style={styles.introSubtitle}>
              이미 토픽룸이 있는 작품은 바로 입장할 수 있어요
            </Text>
          </View>

          <View style={styles.searchBlock}>
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="작품명을 검색하세요"
              placeholderTextColor={Gray[300]}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          {worksSearchQuery.isLoading && debouncedKeyword ? (
            <View style={styles.searchState}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          ) : null}

          <FlatList
            data={searchResults}
            keyExtractor={(item) => `topicroom-create-work-${item.worksId}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.workListContent,
              { paddingBottom: insets.bottom + 92 },
            ]}
            ListEmptyComponent={
              debouncedKeyword ? (
                <Text style={styles.emptyText}>검색 결과가 없어요.</Text>
              ) : (
                <Text style={styles.emptyText}>작품명을 입력해 주세요.</Text>
              )
            }
            renderItem={({ item }) => {
              const selected = selectedId === item.worksId;
              return (
                <Pressable
                  onPress={() => handleSelectWork(item)}
                  style={({ pressed }) => [
                    styles.workItem,
                    selected && styles.workItemSelected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  {item.thumbnailUrl ? (
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      style={styles.workThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.workThumb, styles.workThumbFallback]}>
                      <Text style={styles.workThumbFallbackText}>
                        {(item.worksName || "?").slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.workTextBlock}>
                    <Text style={styles.workName} numberOfLines={1}>
                      {item.worksName}
                    </Text>
                    <Text style={styles.workMeta} numberOfLines={1}>
                      {[item.artistName, item.worksType].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  {selected ? <View style={styles.selectedDot} /> : null}
                </Pressable>
              );
            }}
          />

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              onPress={handleConfirmWork}
              disabled={!selectedWork || checkingExisting || joinMutation.isPending}
              style={({ pressed }) => [
                styles.primaryBtn,
                selectedWork && !checkingExisting && !joinMutation.isPending
                  ? styles.primaryBtnActive
                  : styles.primaryBtnDisabled,
                pressed && selectedWork && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              {checkingExisting || joinMutation.isPending ? (
                <ActivityIndicator size="small" color={C.card} />
              ) : (
                <Text
                  style={[
                    styles.primaryBtnText,
                    (!selectedWork || checkingExisting) && styles.primaryBtnTextDisabled,
                  ]}
                >
                  {existingRoomId != null ? "토픽룸으로 이동하기" : "다음으로"}
                </Text>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.intro}>
              <Text style={styles.introTitle}>
                토픽룸의 이름을 설정해주세요
              </Text>
              <Text style={styles.introSubtitle}>
                아래 주의사항을 참고해주세요
              </Text>
            </View>

            <View style={styles.thumbWrap}>
              {pickedWorks.thumbnailUrl ? (
                <Image
                  source={{ uri: pickedWorks.thumbnailUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbFallbackText}>{initial}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputBlock}>
              <TextInput
                value={name}
                onChangeText={(v) => setName(v.slice(0, MAX_NAME_LENGTH))}
                placeholder="토픽룸 제목을 입력하세요"
                placeholderTextColor={Gray[300]}
                style={styles.input}
                maxLength={MAX_NAME_LENGTH}
              />
              <View style={styles.inputMetaRow}>
                {showHelperWarning && (
                  <Text style={styles.helperText}>
                    한글,영문,숫자 2~10자까지 입력 가능해요
                  </Text>
                )}
                <Text style={styles.counterText}>
                  {trimmed.length}/{COUNTER_MAX}자
                </Text>
              </View>
            </View>

            <View style={styles.warningBlock}>
              <View style={styles.warningHeaderRow}>
                <WarningSmallIcon />
                <Text style={styles.warningTitle}>토픽룸 생성 주의 사항</Text>
              </View>
              <Text style={styles.warningBody}>
                모두가 함께 사용하는 커뮤니티로, 아래와 같은 제목은
                삼가해주세요.
              </Text>
              <View style={styles.warningBullets}>
                <Text style={styles.warningBullet}>
                  {"•"} 특정 인물이나 집단을 비방하는 내용
                </Text>
                <Text style={styles.warningBullet}>
                  {"•"} 비속어, 혐오 표현이 포함된 내용
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
          >
            <Pressable
              onPress={handleCreate}
              disabled={!canCreate}
              style={({ pressed }) => [
                styles.primaryBtn,
                canCreate ? styles.primaryBtnActive : styles.primaryBtnDisabled,
                pressed && canCreate && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color={C.card} />
              ) : (
                <Text
                  style={[
                    styles.primaryBtnText,
                    !canCreate && styles.primaryBtnTextDisabled,
                  ]}
                >
                  토픽룸 생성하기
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}
      <TopicRoomLimitModal
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.card },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    height: undefined,
    backgroundColor: C.card,
  },
  iconBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  icon24: { width: 24, height: 24 },

  scrollContent: {
    paddingBottom: 24,
  },

  completeIntro: {
    paddingHorizontal: 16,
    paddingTop: 40,
    gap: 5,
  },
  completeTitle: {
    ...Typography.heading1,
    color: Gray[900],
  },
  completeSubtitle: {
    ...Typography.body1Medium,
    color: Gray[500],
  },
  graphicWrap: {
    flex: 1,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    transform: [{ translateY: 92 }],
  },
  graphic: {
    width: 280,
    height: "100%",
  },
  graphicFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
  },

  intro: {
    paddingHorizontal: 16,
    paddingTop: 40,
    gap: 5,
  },
  introTitle: {
    ...Typography.heading1,
    color: Gray[900],
  },
  introSubtitle: {
    ...Typography.body1Medium,
    color: Gray[500],
  },
  pickIntro: {
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 5,
  },
  searchBlock: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  searchInput: {
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Gray[50],
    paddingHorizontal: 16,
    color: Gray[900],
    ...Typography.body1Medium,
  },
  searchState: {
    paddingVertical: 18,
    alignItems: "center",
  },
  workListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  emptyText: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: "center",
    paddingTop: 32,
  },
  workItem: {
    minHeight: 76,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Gray[100],
    backgroundColor: C.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  workItemSelected: {
    borderColor: C.primary,
    backgroundColor: Magenta[50],
  },
  workThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Gray[100],
  },
  workThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  workThumbFallbackText: {
    ...Typography.body1Bold,
    color: C.primary,
  },
  workTextBlock: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    gap: 3,
  },
  workName: {
    ...Typography.body1Bold,
    color: Gray[900],
  },
  workMeta: {
    ...Typography.caption1Medium,
    color: Gray[500],
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },

  thumbWrap: {
    alignSelf: "center",
    marginTop: 48,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: Gray[100],
  },
  thumb: { width: 120, height: 120, borderRadius: 60 },
  thumbFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryLight,
  },
  thumbFallbackText: {
    ...Typography.heading1,
    color: C.primary,
  },

  inputBlock: {
    marginTop: 36,
    marginHorizontal: 16,
  },
  input: {
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: Gray[300],
    color: Gray[900],
    ...Typography.body1Medium,
  },
  inputMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 8,
    paddingRight: 10,
    marginTop: 8,
  },
  helperText: {
    ...Typography.caption1Medium,
    color: C.error,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    color: Magenta[300],
    marginLeft: "auto",
  },

  warningBlock: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Gray[50],
    gap: 8,
  },
  warningHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningIcon: {
    width: 28,
    height: 28,
    flexShrink: 0,
  },
  warningTitle: {
    ...Typography.body1Bold,
    color: Gray[900],
  },
  warningBody: {
    ...Typography.caption1Medium,
    color: Gray[500],
  },
  warningBullets: {
    marginTop: 4,
    gap: 2,
  },
  warningBullet: {
    ...Typography.caption1Medium,
    color: Magenta[300],
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.card,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnActive: { backgroundColor: Gray[900] },
  primaryBtnActiveMagenta: { backgroundColor: C.primary },
  primaryBtnDisabled: { backgroundColor: Gray[200] },
  primaryBtnText: { ...Typography.body1Medium, color: C.card },
  primaryBtnTextDisabled: { color: Gray[500] },
  pressed: { opacity: 0.85 },
});
