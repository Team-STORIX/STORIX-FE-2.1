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
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { useCreateTopicRoom } from "../../src/features/topicroom";
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
  const worksId = worksIdRaw ? Number(worksIdRaw) : NaN;
  const worksName = pickParam(params.worksName) ?? "";
  const thumbnailUrl = pickParam(params.thumbnailUrl) ?? "";

  const worksValid = Number.isFinite(worksId) && worksId > 0 && !!worksName;

  const [name, setName] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);
  const createMutation = useCreateTopicRoom();

  const trimmed = name.trim();
  const helperOk = TOPIC_NAME_PATTERN.test(trimmed);
  const canCreate = worksValid && helperOk && !createMutation.isPending;

  const showHelperWarning = trimmed.length > 0 && !helperOk;

  const goToFeedTopicRoom = () =>
    router.replace("/(tabs)/feed?section=topicroom" as never);

  const handleBack = () => {
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
      { worksId, topicRoomName: trimmed },
      {
        onSuccess: (topicRoomId) => {
          setCreatedId(topicRoomId);
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
    () => (worksName || "?").slice(0, 1).toUpperCase(),
    [worksName],
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

      {!worksValid ? (
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>
            잘못된 접근이에요. 작품을 먼저 선택해 주세요.
          </Text>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.missingBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.missingBtnText}>돌아가기</Text>
          </Pressable>
        </View>
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
              {thumbnailUrl ? (
                <Image
                  source={{ uri: thumbnailUrl }}
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
                <Text
                  style={[
                    styles.helperText,
                    {
                      color: showHelperWarning ? Magenta[300] : Gray[500],
                    },
                  ]}
                >
                  한글,영문,숫자 2~10자까지 입력 가능해요
                </Text>
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

  missingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  missingText: {
    ...Typography.body1Medium,
    color: C.textSecondary,
    textAlign: "center",
  },
  missingBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    backgroundColor: C.primary,
  },
  missingBtnText: { ...Typography.body1Semibold, color: C.card },

  completeIntro: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 5,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Gray[900],
    lineHeight: 34,
  },
  completeSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Gray[500],
    lineHeight: 22,
  },
  graphicWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 16,
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
    paddingTop: 16,
    gap: 5,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Gray[900],
    lineHeight: 34,
  },
  introSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Gray[500],
    lineHeight: 22,
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
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    color: Magenta[300],
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
    ...Typography.body2Medium,
    color: Gray[700],
  },
  warningBullets: {
    marginTop: 4,
    gap: 2,
  },
  warningBullet: {
    ...Typography.body2Medium,
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
  primaryBtnText: { ...Typography.body1Semibold, color: C.card },
  primaryBtnTextDisabled: { color: Gray[500] },
  pressed: { opacity: 0.85 },
});
