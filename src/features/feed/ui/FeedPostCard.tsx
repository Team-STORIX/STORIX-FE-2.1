import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { formatCreatedAtLabel } from "../../../lib/utils/formatCreatedAtLabel";
import { LinkedText } from "../../../components/common/LinkedText";
import { OfficialMark } from "../../../components/common/OfficialMark";
import { AdultLockedPanel } from "../../../components/adult";
import {
  useAdultVerificationStore,
  useShouldMaskAdultContent,
} from "../../../store/adultVerification.store";
import { C, Gray, Magenta } from "../../../theme/colors";
import { FontFamily, Typography } from "../../../theme/typography";
import { FeedImageLightbox } from "./FeedImageLightbox";
import { FeedMenuDropdown } from "./FeedMenuDropdown";

// ─── Assets ──────────────────────────────────────────────────────────────────

const likeIcon = require("../../../../assets/icons/common/icon-like.svg");
const likePinkIcon = require("../../../../assets/icons/common/icon-like-pink.svg");
const commentIcon = require("../../../../assets/icons/common/icon-comment.svg");
const menuIcon = require("../../../../assets/icons/common/menu-3dots.svg");
const arrowSmallIcon = require("../../../../assets/icons/common/icon-arrow-forward-small.svg");
const defaultProfileImage = require("../../../../assets/placeholders/profile-default.png");
const birthdayThemeUp = require("../../../../assets/common/birthday/brithdaytheme-up.svg");
const birthdayThemeDown = require("../../../../assets/common/birthday/brithdaytheme-down.svg");

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostCardWorks = {
  thumbnailUrl: string;
  worksName: string;
  artistName: string;
  worksType: string;
  genre: string;
  hashtags: string[];
  isAdultOnly?: boolean;
};

type FeedPostCardProps = {
  variant?: "list" | "detail";
  boardId: number;
  writerUserId: number;
  currentUserId?: number;
  profileImageUrl?: string | null;
  nickName: string;
  role?: string | null;
  createdAt?: string | null;
  content: string;
  images?: string[];
  works?: PostCardWorks | null;
  isSpoiler?: boolean;
  spoilerScript?: string;
  isLiked: boolean;
  likeCount: number;
  replyCount: number;
  onToggleLike: () => void;
  onClickWorksArrow?: () => void;
  onOpenReport?: () => void;
  onOpenDelete?: () => void;
  onOpenBlock?: () => void;
  onPressCard?: () => void;
  birthdayTheme?: boolean;
  birthdayPreview?: boolean;
  disableSpoilerMask?: boolean;
  /** The post or its linked work is adult-only. */
  isAdultOnly?: boolean;
  /** Server flag: this post is adult content hidden from the current user. */
  isBlinded?: boolean;
};

// ─── HashtagRow ───────────────────────────────────────────────────────────────
// Renders every chip invisibly first, then cuts the row at the first chip that
// overflows the container so partial chips never show.

function HashtagRow({ tags }: { tags: string[] }) {
  const containerWidthRef = useRef(0);
  const chipRights = useRef<number[]>([]);
  const [cutIndex, setCutIndex] = useState(tags.length);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    setCutIndex(tags.length);
    setMeasured(false);
    chipRights.current = [];
  }, [tags]);

  if (!tags.length) return null;

  const recalculate = () => {
    const cw = containerWidthRef.current;
    if (cw === 0) return;
    let cut = tags.length;
    for (let i = 0; i < tags.length; i++) {
      const right = chipRights.current[i];
      if (right === undefined) return;
      if (right > cw) {
        cut = i;
        break;
      }
    }
    setMeasured(true);
    setCutIndex(cut);
  };

  return (
    <View
      style={[styles.hashtagRow, !measured && styles.hashtagRowMeasuring]}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
        recalculate();
      }}
    >
      {tags.slice(0, measured ? cutIndex : tags.length).map((tag, i) => (
        <View
          key={`${tag}-${i}`}
          style={styles.hashtagChip}
          onLayout={(e) => {
            if (measured) return;
            chipRights.current[i] = e.nativeEvent.layout.x + e.nativeEvent.layout.width;
            recalculate();
          }}
        >
          <Text style={styles.hashtagText}>{tag.startsWith("#") ? tag : `#${tag}`}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── FeedPostCard ─────────────────────────────────────────────────────────────

export function FeedPostCard({
  variant = "list",
  boardId,
  writerUserId,
  currentUserId,
  profileImageUrl,
  nickName,
  role,
  createdAt,
  content,
  images = [],
  works,
  isSpoiler = false,
  spoilerScript,
  isLiked,
  likeCount,
  replyCount,
  onToggleLike,
  onClickWorksArrow,
  onOpenReport,
  onOpenDelete,
  onOpenBlock,
  onPressCard,
  birthdayTheme = false,
  birthdayPreview = false,
  disableSpoilerMask = false,
  isAdultOnly = false,
  isBlinded,
}: FeedPostCardProps) {
  const router = useRouter();
  const isAdultMasked = useShouldMaskAdultContent({
    isAdultOnly: isAdultOnly || works?.isAdultOnly === true,
    isBlinded,
  });
  const showAdultPrompt = useAdultVerificationStore((state) => state.showPrompt);
  const menuBtnRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isMine = currentUserId != null && writerUserId === currentUserId;
  const isSpoilerHidden = isSpoiler && !spoilerRevealed && !disableSpoilerMask;
  const displayCreatedAt = formatCreatedAtLabel(createdAt);
  const birthdayLayout = birthdayPreview || birthdayTheme;
  const visibleImages = images.slice(0, 3);
  const visibleWorks =
    !isAdultMasked && works?.thumbnailUrl && works.worksName && works.artistName ? works : null;

  const handleMenuPress = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    menuBtnRef.current?.measure((_x, _y, _w, h, _px, py) => {
      setMenuTop(py + h + 4);
      setMenuOpen(true);
    });
  };

  const cardBody = (
    <View style={[styles.card, birthdayLayout && styles.birthdayCard]}>
      {birthdayTheme && (
        <>
          <View pointerEvents="none" style={styles.birthdayThemeTop}>
            <Image source={birthdayThemeUp} style={styles.birthdayThemeImg} contentFit="fill" />
          </View>
          <View pointerEvents="none" style={styles.birthdayThemeBottom}>
            <Image source={birthdayThemeDown} style={styles.birthdayThemeImg} contentFit="fill" />
          </View>
        </>
      )}

      <View style={styles.cardContent}>
        {/* ── Profile row ───────────────────────────────────────── */}
        <Pressable style={styles.profileRow} onPress={() => setMenuOpen(false)}>
          <View style={styles.avatarWrap}>
            <Image
              source={profileImageUrl ? { uri: profileImageUrl } : defaultProfileImage}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>

          <View style={styles.authorMeta}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName} numberOfLines={1}>{nickName}</Text>
              <OfficialMark role={role} />
            </View>
            {!!displayCreatedAt && <Text style={styles.timestamp}>{displayCreatedAt}</Text>}
          </View>

          <Pressable
            ref={menuBtnRef}
            hitSlop={8}
            onPress={handleMenuPress}
            style={styles.menuBtn}
            accessibilityLabel="메뉴"
          >
            <Image source={menuIcon} style={styles.menuIcon} contentFit="contain" />
          </Pressable>
        </Pressable>

        <FeedMenuDropdown
          visible={menuOpen}
          position={{ top: menuTop, right: isMine ? 16 : 8 }}
          isMine={isMine}
          onClose={() => setMenuOpen(false)}
          onDelete={onOpenDelete}
          onReport={onOpenReport}
          onBlock={onOpenBlock}
        />

        {lightboxIndex !== null && (
          <FeedImageLightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {/* ── Works card ────────────────────────────────────────── */}
        {visibleWorks && (
          <View style={styles.worksSection}>
            <View style={styles.worksCard}>
              <View style={styles.worksThumbnailBox}>
                <Image
                  source={{ uri: visibleWorks.thumbnailUrl }}
                  style={styles.worksThumbnail}
                  contentFit="cover"
                />
              </View>

              <View style={styles.worksInfo}>
                <View>
                  <Text
                    style={[styles.worksName, birthdayLayout && styles.birthdayWorksName]}
                    numberOfLines={1}
                  >
                    {visibleWorks.worksName}
                  </Text>
                  <Text
                    style={[styles.worksMeta, birthdayLayout && styles.birthdayWorksMeta]}
                    numberOfLines={1}
                  >
                    {[visibleWorks.artistName, visibleWorks.worksType, visibleWorks.genre]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <HashtagRow tags={visibleWorks.hashtags ?? []} />
              </View>

              {onClickWorksArrow && (
                <Pressable onPress={onClickWorksArrow} style={styles.worksArrowBtn} hitSlop={8}>
                  <Image source={arrowSmallIcon} style={styles.arrowSmall} contentFit="contain" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* ── Body: images + text ──────────────────────────────── */}
        <View style={[styles.spoilerContainer, isAdultMasked && styles.adultMaskedContainer]}>
          {isAdultMasked ? (
            <AdultLockedPanel
              onPressVerify={() => router.push("/profile/adult-verification" as never)}
            />
          ) : (
            <View style={styles.bodySection}>
              <View style={isSpoilerHidden ? styles.spoilerBlur : undefined}>
                {visibleImages.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imageContent}
                  >
                    {visibleImages.map((src, idx) => (
                      <Pressable
                        key={`${boardId}-img-${idx}`}
                        style={[styles.imageBox, birthdayLayout && styles.birthdayImageBox]}
                        onPress={() => setLightboxIndex(idx)}
                      >
                        <Image source={{ uri: src }} style={styles.imageFill} contentFit="cover" />
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                <View style={[styles.textPad, visibleImages.length > 0 && styles.textPadAfterImage]}>
                  <LinkedText
                    style={[styles.contentText, birthdayLayout && styles.birthdayContentText]}
                    numberOfLines={variant === "detail" ? undefined : 3}
                    enabled={!isSpoilerHidden}
                  >
                    {content}
                  </LinkedText>
                </View>
              </View>

              {isSpoilerHidden && (
                <Pressable
                  style={styles.spoilerOverlay}
                  onPress={() => setSpoilerRevealed(true)}
                  accessibilityLabel="스포일러가 포함된 피드글 보기"
                >
                  <Text style={styles.spoilerRevealText}>
                    {spoilerScript ?? "스포일러가 포함된 피드글 보기"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* ── Reactions row ────────────────────────────────────── */}
          <View
            style={[
              styles.reactionRow,
              birthdayLayout && styles.birthdayReactionRow,
              isAdultMasked && styles.adultMaskedReactionRow,
            ]}
          >
            <Pressable
              onPress={onToggleLike}
              style={styles.reactionItem}
              accessibilityLabel="좋아요"
              hitSlop={8}
            >
              <Image
                source={isLiked ? likePinkIcon : likeIcon}
                style={styles.reactionIcon}
                contentFit="contain"
              />
              {likeCount > 0 && (
                <Text
                  style={[
                    styles.reactionCount,
                    isLiked && styles.reactionCountLiked,
                    birthdayLayout && styles.birthdayReactionCount,
                  ]}
                >
                  {likeCount}
                </Text>
              )}
            </Pressable>

            <View
              style={[
                styles.reactionItem,
                styles.commentItem,
                birthdayLayout && styles.birthdayCommentItem,
              ]}
            >
              <Image source={commentIcon} style={styles.reactionIcon} contentFit="contain" />
              {replyCount > 0 && <Text style={styles.reactionCount}>{replyCount}</Text>}
            </View>
          </View>
        </View>
      </View>

      {birthdayTheme && (
        <View
          pointerEvents="none"
          style={variant === "list" ? styles.birthdayCardSeparator : styles.birthdayDetailSeparator}
        />
      )}
    </View>
  );

  if (variant === "list" && onPressCard) {
    return (
      <Pressable
        // A masked post would answer 403 on the detail screen.
        onPress={isAdultMasked ? () => showAdultPrompt("read") : onPressCard}
        style={({ pressed }) => pressed && styles.cardPressed}
        accessibilityRole="button"
        accessibilityLabel={`${nickName}의 피드`}
      >
        {cardBody}
      </Pressable>
    );
  }

  return cardBody;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.9,
  },
  card: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
    backgroundColor: C.card,
    position: "relative",
    overflow: "hidden",
  },
  birthdayCard: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
    borderRadius: 12,
  },
  birthdayThemeTop: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 0,
  },
  birthdayThemeBottom: {
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 0,
  },
  birthdayThemeImg: {
    width: 393,
    height: 70,
  },
  birthdayCardSeparator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Gray[100],
    zIndex: 2,
  },
  birthdayDetailSeparator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: Gray[50],
    zIndex: 2,
  },
  cardContent: {
    zIndex: 1,
  },

  // Profile row
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 41,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    overflow: "hidden",
    backgroundColor: Gray[200],
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  authorMeta: {
    flex: 1,
    minWidth: 0,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  authorName: {
    fontFamily: "SUITMedium",
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: "500",
    lineHeight: 19.6,
    color: Gray[900],
    flexShrink: 1,
  },
  timestamp: {
    marginTop: 2,
    fontFamily: "SUIT",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16.8,
    color: Gray[400],
  },
  menuBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    width: 24,
    height: 24,
  },

  // Works section
  worksSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  worksCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: C.bg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  worksThumbnailBox: {
    width: 62,
    height: 83,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: Gray[200],
    flexShrink: 0,
  },
  worksThumbnail: {
    width: 62,
    height: 83,
  },
  worksInfo: {
    flex: 1,
    height: 83,
    minWidth: 0,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  worksName: {
    ...Typography.body2Bold,
    color: Gray[800],
    marginBottom: 4,
  },
  birthdayWorksName: {
    fontFamily: FontFamily.bold,
    fontSize: 12.86,
    lineHeight: 18.004,
    marginBottom: 0,
  },
  worksMeta: {
    ...Typography.caption1Medium,
    color: Gray[500],
  },
  birthdayWorksMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 11.023,
    lineHeight: 15.432,
  },
  worksArrowBtn: {
    paddingLeft: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    flexShrink: 0,
  },
  arrowSmall: {
    width: 24,
    height: 24,
    tintColor: Gray[400],
  },

  // Hashtag
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 4,
    overflow: "hidden",
  },
  hashtagRowMeasuring: {
    opacity: 0,
  },
  hashtagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.divider,
  },
  hashtagText: {
    ...Typography.caption2Medium,
    color: Gray[500],
  },

  // Body
  spoilerContainer: {
    marginTop: 20,
    position: "relative",
  },
  bodySection: {
    overflow: "hidden",
  },
  spoilerBlur: {
    filter: "blur(17px)",
    overflow: "hidden",
  } as any,
  // Figma 11290:50053: the panel sits right under the profile row and the
  // reactions follow 12px below it.
  adultMaskedContainer: {
    marginTop: 0,
  },
  adultMaskedReactionRow: {
    marginTop: 12,
  },
  imageContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  imageBox: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Gray[100],
    overflow: "hidden",
    backgroundColor: Gray[200],
    flexShrink: 0,
  },
  birthdayImageBox: {
    borderRadius: 8,
  },
  imageFill: {
    width: 200,
    height: 200,
  },
  textPad: {
    paddingHorizontal: 16,
    paddingRight: 56,
  },
  textPadAfterImage: {
    marginTop: 12,
  },
  contentText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: Gray[800],
  },
  birthdayContentText: {
    color: Gray[900],
  },
  spoilerOverlay: {
    position: "absolute",
    top: -4,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  spoilerRevealText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: Magenta[300],
  },

  // Reactions
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 16,
  },
  birthdayReactionRow: {
    marginTop: 12,
  },
  reactionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentItem: {
    marginLeft: 16,
  },
  birthdayCommentItem: {
    marginLeft: 12,
  },
  reactionIcon: {
    width: 24,
    height: 24,
  },
  reactionCount: {
    marginLeft: 4,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19.6,
    color: Gray[500],
  },
  reactionCountLiked: {
    color: Magenta[300],
  },
  // Birthday cards keep the like count gray even when liked (existing look).
  birthdayReactionCount: {
    color: Gray[500],
  },
});
