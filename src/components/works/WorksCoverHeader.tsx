import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import type { WorksDetail } from "../../features/works/api/works.api";
import { C } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Typography } from "../../theme/typography";

const authorMark = require("../../../assets/icons/common/author-mark.svg");
const littleStar = require("../../../assets/icons/common/littleStar.svg");

function worksTypeLabel(type?: string | null) {
  if (type === "WEBTOON") return "웹툰";
  if (type === "WEBNOVEL") return "웹소설";
  return type ?? "";
}

function buildAuthorLine(works: WorksDetail) {
  const items: string[] = [];
  if (works.author) items.push(`P. ${works.author}`);
  if (works.illustrator) items.push(`I. ${works.illustrator}`);
  if (!items.length && works.originalAuthor)
    items.push(`O. ${works.originalAuthor}`);
  return items.join(" , ");
}

export function WorksCoverHeader({ works }: { works: WorksDetail }) {
  const type = worksTypeLabel(works.worksType);
  const authorLine = buildAuthorLine(works);
  const metaLine = [type, works.genre].filter(Boolean).join(" · ");
  const initial = (works.worksName ?? "?").slice(0, 1);

  return (
    <View style={styles.wrapper}>
      {works.thumbnailUrl ? (
        <Image
          source={{ uri: works.thumbnailUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : null}
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.coverCard}>
          {works.thumbnailUrl ? (
            <Image
              source={{ uri: works.thumbnailUrl }}
              style={styles.cover}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Text style={styles.coverFallbackText}>{initial}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{works.worksName}</Text>

        {authorLine ? (
          <View style={styles.authorRow}>
            <Text style={styles.authorLine}>{authorLine}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          {metaLine ? <Text style={styles.metaLine}>{metaLine}</Text> : null}
          {works.avgRating != null ? (
            <View style={styles.ratingRow}>
              <Image
                source={littleStar}
                style={styles.littleStar}
                contentFit="contain"
              />
              <Text style={styles.ratingValue}>
                {works.avgRating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 460,
    position: "relative",
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.84)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  coverCard: {
    marginTop: 8,
    borderRadius: Radius.sm,
    overflow: "hidden",
    shadowColor: C.text,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cover: {
    width: 210,
    height: 280,
    backgroundColor: C.divider,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryLight,
  },
  coverFallbackText: {
    ...Typography.heading1,
    fontSize: 72,
    color: C.primary,
  },
  title: {
    ...Typography.heading3,
    color: C.text,
    textAlign: "center",
    marginTop: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  authorMark: {
    width: 14,
    height: 14,
  },
  authorLine: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  metaLine: {
    ...Typography.caption1Medium,
    color: C.primary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  littleStar: {
    width: 9,
    height: 10,
    marginRight: 4,
  },
  ratingValue: {
    ...Typography.caption1Medium,
    color: C.primary,
  },
});
