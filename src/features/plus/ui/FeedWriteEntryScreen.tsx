import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset, ImagePickerResult } from "expo-image-picker";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import { C, Gray, Magenta } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";
import { useMe } from "../../profile";
import { useWorksDetail } from "../../works";
import { useCreateReaderBoard, type FeedWriteImage } from "../hooks";
import type { BoardTheme } from "../../feed/api/plus/plusWrite";
import { BirthdayThemePreviewBottomSheet } from "./BirthdayThemePreviewBottomSheet";
import {
  FeedWritePickerBottomSheet,
  type PickedFeedWork,
} from "./FeedWritePickerBottomSheet";
import { SpoilerToggleSection } from "./SpoilerToggleSection";
import { WriteTargetWorkCard } from "./WriteTargetWorkCard";

const backIcon = require("../../../../assets/icons/common/back.svg");
const searchIcon = require("../../../../assets/icons/common/search.svg");
const activeIcon = require("../../../../assets/icons/common/active.svg");
const deactiveIcon = require("../../../../assets/icons/common/deactive.svg");
const photoIcon = require("../../../../assets/icons/feed/icon-photo.svg");
const arrowForwardIcon = require("../../../../assets/icons/common/icon-arrow-forward-small.svg");
const cancelIcon = require("../../../../assets/icons/common/cancel.svg");

const MAX_CONTENT_LENGTH = 300;
const MAX_IMAGE_COUNT = 3;
const FEED_DEFAULT_SPOILER = "스포일러가 포함된 피드 보기";
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
// iPhone camera default — not accepted by the backend, but losslessly
// convertible to JPEG before upload (see resolveImageContentType).
const CONVERTIBLE_IMAGE_EXTENSIONS = new Set(["heic", "heif"]);
const CONVERTIBLE_IMAGE_MIME_TYPES = new Set(["image/heic", "image/heif"]);

type PickedFeedImage = FeedWriteImage & {
  id: string;
  // Local-only: derived for display/debugging; not sent to the API.
  fileName: string;
};

type ImagePickerModule = {
  launchImageLibraryAsync: (options: {
    mediaTypes: ("images" | "videos" | "livePhotos")[];
    allowsMultipleSelection: boolean;
    selectionLimit: number;
    orderedSelection: boolean;
    quality: number;
  }) => Promise<ImagePickerResult>;
  MediaTypeOptions?: {
    Images?: unknown;
  };
};

function parseWorksId(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

type ResolvedImage =
  | { ok: true; contentType: string; extension: string; needsConversion: boolean }
  | { ok: false; reason: "unsupported" };

function getExtension(value?: string | null) {
  if (!value) return undefined;
  return value.split("?")[0]?.split("#")[0]?.split(".").pop()?.toLowerCase();
}

function extensionToContentType(extension?: string) {
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return undefined;
}

function accepted(contentType: string): ResolvedImage {
  return {
    ok: true,
    contentType,
    extension: contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1],
    needsConversion: false,
  };
}

// HEIC/HEIF: accepted by the picker but converted to JPEG before upload.
const CONVERTIBLE: ResolvedImage = {
  ok: true,
  contentType: "image/jpeg",
  extension: "jpg",
  needsConversion: true,
};

/**
 * Resolve the upload content type for a picked asset.
 *
 * Resolution order (per asset): mimeType → fileName extension → uri extension.
 * HEIC/HEIF (iPhone camera default) is flagged `needsConversion` so the caller
 * transcodes it to JPEG before upload — it must never be uploaded as-is, since
 * the backend rejects HEIC ("jpg,png,webp만 올릴 수 있습니다"). A truly
 * extensionless but otherwise valid asset still falls back to JPEG.
 */
function resolveImageContentType(asset: ImagePickerAsset): ResolvedImage {
  const mime = asset.mimeType?.toLowerCase();
  if (mime) {
    if (mime === "image/jpg") return accepted("image/jpeg");
    if (CONVERTIBLE_IMAGE_MIME_TYPES.has(mime)) return CONVERTIBLE;
    if (ACCEPTED_IMAGE_TYPES.has(mime)) return accepted(mime);
    // Any other explicit image/* (gif, bmp, tiff, …) is unsupported.
    if (mime.startsWith("image/")) return { ok: false, reason: "unsupported" };
  }

  const fileExtension = getExtension(asset.fileName) ?? getExtension(asset.uri);
  if (fileExtension && CONVERTIBLE_IMAGE_EXTENSIONS.has(fileExtension)) {
    return CONVERTIBLE;
  }

  const fromExtension = extensionToContentType(fileExtension);
  if (fromExtension) return accepted(fromExtension);

  // No negative signal — treat extensionless/unknown assets as JPEG.
  return accepted("image/jpeg");
}

function loadImagePickerModule(): ImagePickerModule {
  const nativeImagePicker = requireOptionalNativeModule("ExponentImagePicker");
  if (!nativeImagePicker) {
    throw new Error("이미지 첨부 기능을 사용하려면 앱을 새로 빌드해야 해요.");
  }

  const module = require("expo-image-picker");
  const candidates = [
    module,
    module?.default,
    module?.default?.default,
  ] as ImagePickerModule[];

  const imagePicker = candidates.find(
    (candidate) => typeof candidate?.launchImageLibraryAsync === "function",
  );

  if (!imagePicker) {
    throw new Error("이미지 선택 모듈을 불러오지 못했어요.");
  }

  return imagePicker;
}

export function FeedWriteEntryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ worksId?: string }>();
  const initialWorksId = parseWorksId(params.worksId);
  const queryClient = useQueryClient();

  const [selectedWork, setSelectedWork] = useState<PickedFeedWork | null>(null);
  const [isWorksNotNeeded, setIsWorksNotNeeded] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [text, setText] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [spoilerMessage, setSpoilerMessage] = useState("");
  const [images, setImages] = useState<PickedFeedImage[]>([]);
  const [theme, setTheme] = useState<BoardTheme | undefined>(undefined);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // The count/limit bar sticks above the keyboard and only shows while typing.
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const submitMutation = useCreateReaderBoard();
  const isSubmitting = submitMutation.isPending;

  const { data: me } = useMe();

  // Hydrate selectedWork from worksId route param using useWorksDetail
  const initialWorksQuery = useWorksDetail(initialWorksId ?? 0);
  useEffect(() => {
    if (!initialWorksId) return;
    if (selectedWork?.id === initialWorksId) return;
    const w = initialWorksQuery.data;
    if (!w) return;
    setSelectedWork({
      id: initialWorksId,
      title: w.worksName ?? "",
      artistName: w.author ?? "",
      worksType: w.worksType ?? "",
      genre: w.genre ?? "",
      hashtags: w.hashtags ?? [],
      meta: [w.author, w.worksType].filter(Boolean).join(" · "),
      thumb: w.thumbnailUrl ?? "",
    });
  }, [initialWorksId, initialWorksQuery.data, selectedWork?.id]);

  const content = text.trim();
  const contentLength = text.length;

  const canSubmit = useMemo(() => {
    if (content.length === 0) return false;
    if (contentLength > MAX_CONTENT_LENGTH) return false;
    if (isWorksNotNeeded) return true;
    if (!selectedWork?.id) return false;
    return true;
  }, [content.length, contentLength, isWorksNotNeeded, selectedWork?.id]);

  const handleToggleNotNeeded = () => {
    setIsWorksNotNeeded((prev) => {
      const next = !prev;
      if (next) setSelectedWork(null);
      return next;
    });
  };

  const onSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    const isWorksSelected = !isWorksNotNeeded && !!selectedWork?.id;
    const worksId = selectedWork?.id ?? 0;

    try {
      await submitMutation.mutateAsync({
        isWorksSelected,
        worksId,
        isSpoiler: spoiler,
        spoilerScript: spoiler ? spoilerMessage.trim() : "",
        content,
        theme,
        images,
      });

      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["plus", "board"] });

      router.replace("/(tabs)/feed" as never);
    } catch (e) {
      Alert.alert(
        "피드 등록 실패",
        e instanceof Error ? e.message : "잠시 후 다시 시도해 주세요.",
      );
    }
  };

  const pickImages = async () => {
    if (isSubmitting) return;

    const remaining = MAX_IMAGE_COUNT - images.length;
    if (remaining <= 0) {
      Alert.alert(
        "이미지 첨부",
        `이미지는 최대 ${MAX_IMAGE_COUNT}장까지 첨부할 수 있어요.`,
      );
      return;
    }

    try {
      const ImagePicker = loadImagePickerModule();

      const result = await ImagePicker.launchImageLibraryAsync({
        // Expo SDK 54: MediaTypeOptions is deprecated — use a MediaType[].
        mediaTypes: ["images"],
        allowsMultipleSelection: remaining > 1,
        selectionLimit: remaining,
        orderedSelection: true,
        quality: 1,
      });

      if (result.canceled) return;

      let rejectedCount = 0;
      let conversionFailed = false;
      const picked: PickedFeedImage[] = [];

      for (let index = 0; index < result.assets.length; index += 1) {
        const asset = result.assets[index];
        const resolved = resolveImageContentType(asset);

        if (__DEV__) {
          console.log("[FeedWrite] picked asset", {
            mimeType: asset.mimeType,
            fileName: asset.fileName,
            uriExtension: getExtension(asset.uri),
            resolved,
          });
        }

        if (!resolved.ok) {
          rejectedCount += 1;
          continue;
        }

        let uri = asset.uri;
        let { contentType, extension } = resolved;
        let fileName =
          asset.fileName ?? `upload-${Date.now()}-${index}.${extension}`;

        // HEIC/HEIF → transcode to JPEG before upload.
        if (resolved.needsConversion) {
          try {
            const converted = await ImageManipulator.manipulateAsync(
              asset.uri,
              [],
              { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
            );
            uri = converted.uri;
            contentType = "image/jpeg";
            extension = "jpg";
            fileName = `upload-${Date.now()}-${index}.jpg`;

            if (__DEV__) {
              console.log("[FeedWrite] converted asset", {
                fromUri: asset.uri,
                toUri: uri,
                contentType,
                fileName,
                extension,
              });
            }
          } catch (err) {
            if (__DEV__) console.log("[FeedWrite] conversion failed", err);
            conversionFailed = true;
            continue;
          }
        }

        picked.push({
          id: `${uri}-${Date.now()}-${index}`,
          uri,
          contentType,
          fileName,
        });
      }

      if (picked.length === 0) {
        Alert.alert(
          "이미지 첨부",
          conversionFailed
            ? "이미지를 변환하지 못했어요. 다른 사진을 선택해주세요."
            : "jpg, png, webp 형식의 이미지만 업로드할 수 있어요.",
        );
        return;
      }

      if (conversionFailed) {
        Alert.alert(
          "이미지 첨부",
          "이미지를 변환하지 못했어요. 다른 사진을 선택해주세요.",
        );
      } else if (rejectedCount > 0) {
        Alert.alert(
          "이미지 첨부",
          "jpg, png, webp 형식의 이미지만 업로드할 수 있어요. 지원하지 않는 이미지는 제외했어요.",
        );
      }

      setImages((current) => [...current, ...picked].slice(0, MAX_IMAGE_COUNT));
    } catch (e) {
      const message =
        e instanceof Error && e.message.includes("ExponentImagePicker")
          ? "이미지 첨부 기능을 사용하려면 앱을 새로 빌드해야 해요."
          : e instanceof Error
            ? e.message
            : "이미지를 다시 선택해 주세요.";

      Alert.alert("이미지 선택 실패", message);
    }
  };

  const removeImage = (id: string) => {
    if (isSubmitting) return;
    setImages((current) => current.filter((image) => image.id !== id));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Image
            source={backIcon}
            style={styles.headerIcon}
            contentFit="contain"
          />
        </Pressable>

        <Text style={styles.headerTitle}>피드</Text>

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
          hitSlop={12}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && canSubmit && !isSubmitting && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="등록"
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Text
              style={[
                styles.submitText,
                canSubmit && !isSubmitting
                  ? styles.submitTextActive
                  : styles.submitTextDisabled,
              ]}
            >
              완료
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.worksHeaderRow}>
          <Text style={styles.sectionHeading}>작품선택</Text>
          <View style={styles.notNeededRow}>
            <Text style={styles.notNeededLabel}>작품선택이 필요없어요</Text>
            <Pressable
              onPress={handleToggleNotNeeded}
              hitSlop={6}
              accessibilityRole="switch"
              accessibilityState={{ checked: isWorksNotNeeded }}
              accessibilityLabel="작품선택 필요없음 토글"
            >
              <Image
                source={isWorksNotNeeded ? activeIcon : deactiveIcon}
                style={styles.toggleIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>

        {!isWorksNotNeeded ? (
          <>
            <Pressable
              onPress={() => setIsPickerOpen(true)}
              style={({ pressed }) => [
                styles.searchBar,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="작품 검색"
            >
              <Text style={styles.searchPlaceholder}>
                함께 이야기하고 싶은 작품을 검색하세요
              </Text>
              <Image
                source={searchIcon}
                style={styles.searchIcon}
                contentFit="contain"
              />
            </Pressable>

            {selectedWork ? (
              <View style={styles.selectedWorkWrap}>
                <WriteTargetWorkCard
                  title={selectedWork.title}
                  meta={selectedWork.meta}
                  thumbnailUrl={selectedWork.thumb || undefined}
                  loading={
                    !!initialWorksId &&
                    selectedWork.id === initialWorksId &&
                    initialWorksQuery.isLoading
                  }
                />
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.boardSectionHeader}>
          <Text style={styles.sectionHeading}>게시글 작성</Text>
        </View>

        {images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.previewScroll}
            contentContainerStyle={styles.previewList}
            keyboardShouldPersistTaps="handled"
          >
            {images.map((image) => (
              <View key={image.id} style={styles.previewItem}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => removeImage(image.id)}
                  disabled={isSubmitting}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.removeImageButton,
                    pressed && !isSubmitting && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="이미지 삭제"
                >
                  <Image
                    source={cancelIcon}
                    style={styles.removeImageIcon}
                    contentFit="contain"
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.textareaWrap}>
          <TextInput
            value={text}
            onChangeText={(next) =>
              setText(
                next.length > MAX_CONTENT_LENGTH
                  ? next.slice(0, MAX_CONTENT_LENGTH)
                  : next,
              )
            }
            maxLength={MAX_CONTENT_LENGTH}
            multiline
            textAlignVertical="top"
            placeholder="좋아하는 작품에 대해 적어보세요!"
            placeholderTextColor={C.textMuted}
            style={styles.textarea}
          />
        </View>

        <SpoilerToggleSection
          enabled={spoiler}
          onToggle={() => setSpoiler((prev) => !prev)}
          message={spoilerMessage}
          onMessageChange={setSpoilerMessage}
          defaultMessage={FEED_DEFAULT_SPOILER}
        />

        <Pressable
          onPress={() => setIsThemeSheetOpen(true)}
          style={({ pressed }) => [styles.themeRow, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="생일 테마 적용"
        >
          <View style={styles.themeRowLeft}>
            <Text style={styles.themeRowLabel}>생일 테마 적용</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>Beta</Text>
            </View>
          </View>
          <View style={styles.themeRowRight}>
            <Text
              style={[
                styles.themeRowStatus,
                theme === "BIRTHDAY" && styles.themeRowStatusActive,
              ]}
            >
              {theme === "BIRTHDAY" ? "적용됨" : "선택 안함"}
            </Text>
            <Image
              source={arrowForwardIcon}
              style={styles.themeRowArrow}
              contentFit="contain"
            />
          </View>
        </Pressable>
      </ScrollView>

      {isKeyboardVisible ? (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Platform.OS === "ios" ? 12 : 8 },
          ]}
        >
          <Pressable
            onPress={pickImages}
            disabled={isSubmitting || images.length >= MAX_IMAGE_COUNT}
            style={({ pressed }) => [
              styles.imagePicker,
              pressed &&
                !isSubmitting &&
                images.length < MAX_IMAGE_COUNT &&
                styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="이미지 추가"
          >
            <Image
              source={photoIcon}
              style={styles.photoIcon}
              contentFit="contain"
            />
            <Text style={styles.imageCount}>
              {images.length}/{MAX_IMAGE_COUNT}
            </Text>
          </Pressable>

          <Text style={styles.contentCounter}>
            <Text
              style={
                contentLength === MAX_CONTENT_LENGTH
                  ? styles.contentCounterWarn
                  : styles.contentCounterValue
              }
            >
              {contentLength}
            </Text>
            <Text style={styles.contentCounterTotal}>
              /{MAX_CONTENT_LENGTH}
            </Text>
          </Text>
        </View>
      ) : null}

      <FeedWritePickerBottomSheet
        visible={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onPick={(work) => {
          setSelectedWork(work);
          setIsWorksNotNeeded(false);
        }}
      />

      <BirthdayThemePreviewBottomSheet
        visible={isThemeSheetOpen}
        onClose={() => setIsThemeSheetOpen(false)}
        initialEnabled={theme === "BIRTHDAY"}
        onApply={(enabled) => setTheme(enabled ? "BIRTHDAY" : undefined)}
        draft={{
          nickName: me?.nickName ?? "나",
          profileImageUrl: me?.profileImageUrl ?? null,
          content,
          images: images.map((image) => image.uri),
          works: selectedWork
            ? {
                thumbnailUrl: selectedWork.thumb,
                worksName: selectedWork.title,
                artistName: selectedWork.artistName,
                worksType: selectedWork.worksType,
                genre: selectedWork.genre,
                hashtags:
                  selectedWork.hashtags.length > 0
                    ? selectedWork.hashtags
                    : selectedWork.genre
                      ? [selectedWork.genre]
                      : [],
              }
            : null,
          isSpoiler: spoiler,
          spoilerScript: spoiler ? spoilerMessage.trim() : undefined,
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.card,
  },
  // 2.0: h-13.5 (= 54px)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: C.card,
  },
  headerBtn: {
    minWidth: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...Typography.body1Medium,
    color: C.text,
  },
  submitText: {
    ...Typography.body1Medium,
  },
  submitTextActive: {
    color: Magenta[500],
  },
  submitTextDisabled: {
    color: C.textMuted,
  },
  pressed: {
    opacity: 0.6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  // 2.0 “작품선택” section header — heading-2, mt-6 mb-4
  worksHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeading: {
    ...Typography.heading2,
    color: C.text,
  },
  notNeededRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notNeededLabel: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  toggleIcon: {
    width: 32,
    height: 18,
  },
  // 2.0: rounded-lg bg-gray-50 border-gray-50 px-2 py-3 body-1
  searchBar: {
    position: "relative",
    width: "100%",
    borderRadius: Radius.sm,
    backgroundColor: Gray[50],
    borderWidth: 1,
    borderColor: Gray[50],
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchPlaceholder: {
    ...Typography.body1Medium,
    color: Gray[400],
  },
  searchIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    width: 20,
    height: 20,
  },
  selectedWorkWrap: {
    marginBottom: 24,
  },
  // 2.0: -mx-4 px-4 border-t border-gray-100 + heading-2 mt-6
  boardSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: 24,
  },
  // 2.0: -mx-4 px-4 mt-4 h-60 (240px) border-bottom
  textareaWrap: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  textarea: {
    height: 240,
    width: "100%",
    ...Typography.body1Medium,
    color: Gray[700],
    padding: 0,
    textAlignVertical: "top",
  },
  // Kept in normal flex flow (not absolute) so KeyboardAvoidingView lifts it
  // directly above the keyboard while typing. Only mounted while the keyboard
  // is visible (see isKeyboardVisible).
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  photoIcon: {
    width: 24,
    height: 24,
  },
  imageCount: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  // Image preview row — matches the feed post card (236 square, radius 12,
  // gray-100 border, gap 12, left padding 16, horizontal scroll).
  previewScroll: {
    marginHorizontal: -16,
    marginTop: 16,
  },
  previewList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  previewItem: {
    position: "relative",
    width: 236,
    height: 236,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Gray[100],
    overflow: "hidden",
    backgroundColor: Gray[100],
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 15, 15, 0.6)",
  },
  removeImageIcon: {
    width: 16,
    height: 16,
    tintColor: C.card,
  },
  contentCounter: {
    ...Typography.body1Bold,
    paddingTop: 2,
  },
  contentCounterValue: {
    color: Gray[400],
  },
  contentCounterWarn: {
    color: C.error,
  },
  contentCounterTotal: {
    color: C.textMuted,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  themeRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  themeRowLabel: {
    ...Typography.body1Bold,
    color: C.text,
  },
  betaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Magenta[20],
  },
  betaBadgeText: {
    ...Typography.caption2Extrabold,
    color: Magenta[300],
  },
  themeRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  themeRowStatus: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  themeRowStatusActive: {
    color: Magenta[300],
  },
  themeRowArrow: {
    width: 20,
    height: 20,
    tintColor: Gray[400],
  },
});
