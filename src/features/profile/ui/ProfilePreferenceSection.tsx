import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { C, Gray, Typography , FontFamily} from "../../../theme";
import { useProfileFavoriteWorksPreview } from "../hooks";

const findWritersButton = require("../../../../assets/icons/profile/find-writers.svg");
const findBooksButton = require("../../../../assets/icons/profile/find-books.svg");
const nextArrowIcon = require("../../../../assets/icons/common/icon-arrow-gray.svg");

const WORK_RENDER_LIMIT = 4;

export function ProfilePreferenceSection() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const worksQuery = useProfileFavoriteWorksPreview();

  const works = useMemo(
    () => worksQuery.data?.works.slice(0, WORK_RENDER_LIMIT) ?? [],
    [worksQuery.data?.works],
  );

  const emptySlots = Math.max(0, WORK_RENDER_LIMIT - works.length);

  const itemWidth = Math.floor((screenWidth - 32 - 4 * 3) / 4);
  const thumbHeight = Math.round(itemWidth * (116 / 87));

  return (
    <View>
      <View style={[styles.section, styles.worksSection]}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>관심 작품</Text>
            <Text style={styles.count}>{worksQuery.data?.count ?? 0}</Text>
          </View>

          <Pressable
            onPress={() => router.push("/profile/likes")}
            accessibilityRole="button"
          >
            <Image
              source={nextArrowIcon}
              style={styles.moreIcon}
              contentFit="contain"
              tintColor={Gray[300]}
            />
          </Pressable>
        </View>

        {(worksQuery.data?.count ?? 0) > 0 ? (
          <View style={styles.worksContent}>
            <View style={styles.worksRow}>
              {works.map((work) => (
                <View key={work.id} style={{ width: itemWidth }}>
                  <View style={[styles.workThumbWrap, { width: itemWidth, height: thumbHeight }]}>
                    {work.imageUrl ? (
                      <Image
                        source={{ uri: work.imageUrl }}
                        style={{ width: itemWidth, height: thumbHeight }}
                        contentFit="cover"
                      />
                    ) : null}
                  </View>
                  <Text style={[styles.workTitle, { width: itemWidth }]} numberOfLines={1}>
                    {work.title}
                  </Text>
                  <Text style={[styles.workAuthor, { width: itemWidth }]} numberOfLines={1}>
                    {work.author}
                  </Text>
                </View>
              ))}

              {Array.from({ length: emptySlots }).map((_, index) => (
                <View
                  key={`empty-${index}`}
                  style={[{ width: itemWidth }, styles.emptyWorkItem]}
                >
                  <View style={[styles.emptyWorkThumb, { width: itemWidth, height: thumbHeight }]} />
                  <Text style={styles.emptyDot}>.</Text>
                  <Text style={[styles.emptyDot, styles.emptyDotSmall]}>.</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>아직 관심 작품이 없어요...</Text>
            <Pressable
              onPress={() => router.push("/search")}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="작품 찾기"
            >
              <Image
                source={findBooksButton}
                style={styles.emptyButtonImage}
                contentFit="contain"
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 28,
    backgroundColor: C.card,
  },
  worksSection: {
    borderBottomWidth: 8,
    borderBottomColor: C.bg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...Typography.heading3,
    lineHeight: 25.2,
    color: C.text,
  },
  count: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 25.2,
    color: Gray[300],
  },
  moreIcon: {
    width: 24,
    height: 24,
  },
  worksContent: {
    marginTop: 24,
    width: "100%",
  },
  worksRow: {
    flexDirection: "row",
    gap: 4,
  },
  workThumbWrap: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Gray[100],
  },
  workTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16.8,
    marginTop: 7,
    color: C.text,
  },
  workAuthor: {
    ...Typography.caption2Medium,
    marginTop: 3,
    color: Gray[400],
  },
  emptyWorkItem: {
    opacity: 0,
  },
  emptyWorkThumb: {
    borderRadius: 4,
  },
  emptyDot: {
    marginTop: 7,
    width: 87,
  },
  emptyDotSmall: {
    marginTop: 3,
  },
  emptyState: {
    marginTop: 24,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.heading3,
    color: Gray[500],
  },
  emptyButtonImage: {
    width: 131,
    height: 36,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
