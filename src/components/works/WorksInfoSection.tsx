import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorksDetail } from "../../features/works/api/works.api";
import { openExternalLink } from "../../lib/link/openExternalLink";
import { C, Gray } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Typography } from "../../theme/typography";
import { HashtagChip } from "../common/HashtagChip";

const naverWebtoon = require("../../../assets/images/platforms/naverWebtoon.png");
const ridibooks = require("../../../assets/images/platforms/ridibooks.png");
const kakaoWebtoon = require("../../../assets/images/platforms/kakaoWebtoon.png");
const kakaoPage = require("../../../assets/images/platforms/kakaoPage.png");
const naverSeries = require("../../../assets/images/platforms/naverSeries.png");
const bomtoon = require("../../../assets/images/platforms/bomtoon.png");
const lezhin = require("../../../assets/images/platforms/lezhin.png");
const mrBlue = require("../../../assets/images/platforms/mrBlue.png");

const platformKey = (platform: string) =>
  platform.toLowerCase().replace(/[\s_]/g, "");

/**
 * Matches both enum codes (NAVER_SERIES) and display names (네이버 시리즈).
 * Order matters: series before the generic naver match, and the specific
 * kakao names before the loose 웹툰/페이지 fallbacks.
 */
const PLATFORM_ICONS: [keywords: string[], icon: number][] = [
  [["naverseries", "시리즈"], naverSeries],
  [["naver", "네이버"], naverWebtoon],
  [["ridi", "리디"], ridibooks],
  [["kakaopage", "카카오페이지"], kakaoPage],
  [["kakaowebtoon", "카카오웹툰"], kakaoWebtoon],
  [["bomtoon", "봄툰"], bomtoon],
  [["lezhin", "레진"], lezhin],
  [["mrblue", "미스터블루"], mrBlue],
  [["웹툰"], kakaoWebtoon],
  [["페이지"], kakaoPage],
];

function platformIcon(platform: string) {
  const value = platformKey(platform);
  const match = PLATFORM_ICONS.find(([keywords]) =>
    keywords.some((keyword) => value.includes(keyword)),
  );
  return match?.[1] ?? null;
}

/**
 * Platform names with the landing URL of this work on each, when the backend
 * has one. A platform that only appears in the links is still listed.
 */
function platformEntries(works: WorksDetail) {
  const urls = new Map<string, string>();
  for (const link of works.platformLinks ?? []) {
    const url = link.landingUrl?.trim();
    if (url) urls.set(platformKey(link.platform), url);
  }

  const names = [
    ...(works.platforms ?? []),
    ...(works.platformLinks ?? []).map((link) => link.platform),
  ].filter((item) => item.trim().length > 0);

  const seen = new Set<string>();
  return names.flatMap((name) => {
    const key = platformKey(name);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ name, landingUrl: urls.get(key) ?? null }];
  });
}

export function WorksInfoSection({ works }: { works: WorksDetail }) {
  const platforms = platformEntries(works);
  const hashtags = (works.hashtags ?? []).filter(
    (item) => item.trim().length > 0,
  );
  const description = works.description?.trim() ?? "";

  return (
    <View style={styles.container}>
      <SectionTitle title="감상 가능한 곳" />
      {platforms.length === 0 ? (
        <Text style={styles.emptyText}>플랫폼 정보가 아직 없어요.</Text>
      ) : (
        <View style={styles.platformList}>
          {platforms.map(({ name, landingUrl }) => {
            const icon = platformIcon(name);
            return (
              <Pressable
                key={name}
                style={({ pressed }) => [
                  styles.platformRow,
                  pressed && styles.pressed,
                ]}
                disabled={!landingUrl}
                onPress={() => {
                  if (landingUrl) void openExternalLink(landingUrl);
                }}
                accessibilityRole={landingUrl ? "link" : undefined}
                accessibilityLabel={landingUrl ? `${name}에서 보기` : name}
              >
                <View style={styles.platformIconWrap}>
                  {icon ? (
                    <Image
                      source={icon}
                      style={styles.platformIcon}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.platformFallbackText}>
                      {name.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.platformLabel}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <SectionTitle title="작품 소개" />
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : (
        <Text style={styles.emptyText}>작품 소개가 아직 없어요.</Text>
      )}

      <SectionTitle title="키워드" />
      {hashtags.length === 0 ? (
        <Text style={styles.emptyText}>키워드가 아직 없어요.</Text>
      ) : (
        <View style={styles.hashtagWrap}>
          {hashtags.map((tag) => (
            <HashtagChip key={tag} label={tag} />
          ))}
        </View>
      )}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: C.text,
    marginBottom: 12,
    marginTop: 4,
  },
  emptyText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginBottom: 28,
  },
  platformList: {
    gap: 10,
    marginBottom: 28,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  platformIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: C.divider,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  platformIcon: {
    width: 36,
    height: 36,
  },
  platformFallbackText: {
    ...Typography.caption1Extrabold,
    color: C.primary,
  },
  platformLabel: {
    ...Typography.body1Bold,
    color: C.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  description: {
    ...Typography.body2Medium,
    color: Gray[500],
    marginBottom: 8,
  },
  hashtagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
