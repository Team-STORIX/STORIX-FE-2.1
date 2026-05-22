import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gray, Magenta } from "../../../theme/colors";

// ─── Assets ──────────────────────────────────────────────────────────────────

const likeIcon = require("../../../../assets/icons/common/icon-like.svg");
const likePinkIcon = require("../../../../assets/icons/common/icon-like-pink.svg");
const commentIcon = require("../../../../assets/icons/common/icon-comment.svg");
const menuIcon = require("../../../../assets/icons/common/menu-3dots.svg");
const arrowSmallIcon = require("../../../../assets/icons/common/icon-arrow-forward-small.svg");
const commentDropdown = require("../../../../assets/icons/common/comment-dropdown.svg");
const deleteDropdown = require("../../../../assets/icons/common/delete-dropdown.svg");
const defaultProfileImage = require("../../../../assets/placeholders/profile-default.png");
const xIcon = require("../../../../assets/icons/common/x.svg");

const birthdayFeedThemes = {
  article: require("../../../../assets/common/birthday/b_feed_article.svg"),
  photo: require("../../../../assets/common/birthday/b_feed_photo.svg"),
  photoArticle: require("../../../../assets/common/birthday/b_feed_photo_article.svg"),
  contentlinkArticle: require("../../../../assets/common/birthday/b_feed_contentlink_article.svg"),
  contentlinkPhoto: require("../../../../assets/common/birthday/b_feed_contentlink_photo.svg"),
  contentlinkPhotoArticle: require("../../../../assets/common/birthday/b_feed_contentlink_photo_article.svg"),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostCardWorks = {
  thumbnailUrl: string;
  worksName: string;
  artistName: string;
  worksType: string;
  genre: string;
  hashtags: string[];
};

type FeedPostCardVariant = "list" | "detail";

type FeedPostCardProps = {
  variant?: FeedPostCardVariant;
  boardId: number;
  writerUserId: number;
  currentUserId?: number;
  profileImageUrl?: string | null;
  nickName: string;
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
  onPressCard?: () => void;
  birthdayTheme?: boolean;
};

function getBirthdayThemeSource({
  hasArticle,
  hasPhoto,
  hasContentlink,
}: {
  hasArticle: boolean;
  hasPhoto: boolean;
  hasContentlink: boolean;
}) {
  if (hasContentlink && hasPhoto && hasArticle)
    return birthdayFeedThemes.contentlinkPhotoArticle;
  if (hasContentlink && hasPhoto) return birthdayFeedThemes.contentlinkPhoto;
  if (hasContentlink && hasArticle)
    return birthdayFeedThemes.contentlinkArticle;
  if (hasPhoto && hasArticle) return birthdayFeedThemes.photoArticle;
  if (hasPhoto) return birthdayFeedThemes.photo;
  if (hasArticle) return birthdayFeedThemes.article;
  return null;
}

// ─── HashtagRow ───────────────────────────────────────────────────────────────

function HashtagRow({ tags }: { tags: string[] }) {
  const containerWidthRef = useRef(0);
  const chipRights = useRef<number[]>([]);
  const [cutIndex, setCutIndex] = useState(tags.length);

  useEffect(() => {
    setCutIndex(tags.length);
    chipRights.current = [];
  }, [tags]);

  if (!tags.length) return null;

  const recalculate = (cw: number) => {
    if (cw === 0) return;
    let cut = tags.length;
    for (let i = 0; i < tags.length; i++) {
      const right = chipRights.current[i];
      if (right !== undefined && right > cw) {
        cut = i;
        break;
      }
    }
    setCutIndex(cut);
  };

  return (
    <View
      style={styles.hashtagRow}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
        recalculate(containerWidthRef.current);
      }}
    >
      {tags.map((tag, i) => (
        <View
          key={`${tag}-${i}`}
          style={[
            styles.hashtagChip,
            i >= cutIndex ? { display: "none" } : undefined,
          ]}
          onLayout={(e) => {
            if (i >= cutIndex) return;
            chipRights.current[i] =
              e.nativeEvent.layout.x + e.nativeEvent.layout.width;
            recalculate(containerWidthRef.current);
          }}
        >
          <Text style={styles.hashtagText}>
            {tag.startsWith("#") ? tag : `#${tag}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── ZoomableImage ────────────────────────────────────────────────────────────

function ZoomableImage({
  src,
  width,
  isActive,
  onTap,
}: {
  src: string
  width: number
  isActive: boolean
  onTap: () => void
}) {
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)

  useEffect(() => {
    if (!isActive) {
      scale.value = withSpring(1)
      savedScale.value = 1
    }
  }, [isActive, scale, savedScale])

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, savedScale.value * e.scale)
    })
    .onEnd(() => {
      savedScale.value = scale.value
      if (scale.value < 1.05) {
        scale.value = withSpring(1)
        savedScale.value = 1
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable onPress={onTap} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View style={[{ width, height: '100%' }, animatedStyle]}>
          <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        </Animated.View>
      </GestureDetector>
    </Pressable>
  )
}

// ─── FeedPostCard ─────────────────────────────────────────────────────────────

export function FeedPostCard({
  variant = "list",
  boardId,
  writerUserId,
  currentUserId,
  profileImageUrl,
  nickName,
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
  onPressCard,
  birthdayTheme = false,
}: FeedPostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDropdownTop, setMenuDropdownTop] = useState(0);
  const menuBtnRef = useRef<any>(null);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxCurrent, setLightboxCurrent] = useState(0);
  const [lightboxControls, setLightboxControls] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  const handleMenuPress = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    menuBtnRef.current?.measure(
      (
        _fx: number,
        _fy: number,
        _w: number,
        h: number,
        _px: number,
        py: number,
      ) => {
        setMenuDropdownTop(py + h + 4);
        setMenuOpen(true);
      },
    );
  };

  const isMine = currentUserId != null && writerUserId === currentUserId;
  const isSpoilerHidden = isSpoiler && !spoilerRevealed;

  const showWorks =
    works != null &&
    !!works.thumbnailUrl &&
    !!works.worksName &&
    !!works.artistName;
  const hasArticle = content.trim().length > 0;
  const hasPhoto = images.some((src) => src.trim().length > 0);
  const hasContentlink = works != null && !!works.worksName?.trim();
  const birthdayThemeSource = birthdayTheme
    ? getBirthdayThemeSource({
        hasArticle,
        hasPhoto,
        hasContentlink,
      })
    : null;

  const cardBody = (
    <View style={styles.card}>
      {/* ── Birthday theme background ─────────────────────────── */}
      {birthdayThemeSource && (
        <View pointerEvents="none" style={styles.birthdayThemeLayer}>
          <Image
            source={birthdayThemeSource}
            style={styles.birthdayThemeImage}
            contentFit="cover"
          />
        </View>
      )}

      {/* ── Card content (above birthday theme) ───────────────── */}
      <View style={styles.cardContent}>

      {/* ── Profile row ───────────────────────────────────────── */}
      <Pressable style={styles.profileRow} onPress={() => setMenuOpen(false)}>
        <View style={styles.avatarWrap}>
          <Image
            source={
              profileImageUrl ? { uri: profileImageUrl } : defaultProfileImage
            }
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{nickName}</Text>
          {!!createdAt && <Text style={styles.timestamp}>{createdAt}</Text>}
        </View>

        {/* Menu button */}
        <Pressable
          ref={menuBtnRef}
          hitSlop={8}
          onPress={handleMenuPress}
          style={styles.menuBtn}
          accessibilityLabel="메뉴"
        >
          <Image
            source={menuIcon}
            style={styles.menuIcon}
            contentFit="contain"
          />
        </Pressable>
      </Pressable>

      {/* ── Menu dropdown ─────────────────────────────────────── */}
      {menuOpen && (
        <Modal
          transparent
          visible
          animationType="none"
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setMenuOpen(false)}
          >
            <Pressable
              style={[styles.menuDropdown, { top: menuDropdownTop }]}
              onPress={() => {
                setMenuOpen(false);
                if (isMine) onOpenDelete?.();
                else onOpenReport?.();
              }}
            >
              <Image
                source={isMine ? deleteDropdown : commentDropdown}
                style={styles.menuDropdownImg}
                contentFit="contain"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setLightboxIndex(null)}>
          <View style={styles.lightboxBackdrop}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: lightboxIndex * screenWidth, y: 0 }}
              onScroll={(e) => {
                const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setLightboxCurrent(page);
              }}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
            >
              {images.slice(0, 3).map((src, idx) => (
                <ZoomableImage
                  key={idx}
                  src={src}
                  width={screenWidth}
                  isActive={lightboxCurrent === idx}
                  onTap={() => setLightboxControls((v) => !v)}
                />
              ))}
            </ScrollView>

            {lightboxControls && (
              <View style={[styles.lightboxHeader, { top: topInset }]}>
                <Pressable
                  onPress={() => setLightboxIndex(null)}
                  style={styles.lightboxCloseBtn}
                  hitSlop={8}
                >
                  <Image source={xIcon} style={styles.lightboxCloseIcon} contentFit="contain" tintColor="#ffffff" />
                </Pressable>
                <Text style={styles.lightboxCounterText} pointerEvents="none">
                  {lightboxCurrent + 1}/{images.slice(0, 3).length}
                </Text>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* ── Works card ────────────────────────────────────────── */}
      {showWorks && (
        <View style={styles.worksSection}>
          <View style={styles.worksCard}>
            <View style={styles.worksThumbnailBox}>
              <Image
                source={{ uri: works!.thumbnailUrl }}
                style={styles.worksThumbnail}
                contentFit="cover"
              />
            </View>

            <View style={styles.worksInfo}>
              <Text style={styles.worksName} numberOfLines={1}>
                {works!.worksName}
              </Text>
              <Text style={styles.worksMeta} numberOfLines={1}>
                {[works!.artistName, works!.worksType, works!.genre]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              <HashtagRow tags={works!.hashtags ?? []} />
            </View>

            {onClickWorksArrow && (
              <Pressable
                onPress={onClickWorksArrow}
                hitSlop={8}
                style={styles.worksArrowBtn}
                accessibilityLabel="작품 상세 보기"
              >
                <Image
                  source={arrowSmallIcon}
                  style={styles.arrowSmall}
                  contentFit="contain"
                />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ── Body: images + text ──────────────────────────────── */}
      <View style={styles.spoilerContainer}>
        <View style={styles.bodySection}>
          <View style={isSpoilerHidden ? ({ filter: 'blur(17px)', overflow: 'hidden' } as any) : undefined}>
            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
                contentContainerStyle={styles.imageContent}
              >
                {images.slice(0, 3).map((src, idx) => (
                  <Pressable key={`${boardId}-img-${idx}`} style={styles.imageBox} onPress={() => { setLightboxIndex(idx); setLightboxCurrent(idx); setLightboxControls(false); }}>
                    <Image
                      source={{ uri: src }}
                      style={styles.imageFill}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={[styles.textPad, images.length > 0 && styles.textPadAfterImage]}>
              <Text
                style={styles.contentText}
                numberOfLines={variant === 'detail' ? undefined : 3}
              >
                {content}
              </Text>
            </View>
          </View>
        </View>

        {isSpoilerHidden && (
          <Pressable
            style={styles.spoilerOverlay}
            onPress={() => setSpoilerRevealed(true)}
            accessibilityLabel="스포일러가 포함된 피드글 보기"
          >
            <Text style={styles.spoilerRevealText}>
              {spoilerScript ?? '스포일러가 포함된 피드글 보기'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Reactions row ────────────────────────────────────── */}
      <View style={styles.reactionRow}>
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
            <Text style={styles.reactionCount}>{likeCount}</Text>
          )}
        </Pressable>

        <View style={[styles.reactionItem, styles.commentItem]}>
          <Image
            source={commentIcon}
            style={styles.reactionIcon}
            contentFit="contain"
          />
          {replyCount > 0 && (
            <Text style={styles.reactionCount}>{replyCount}</Text>
          )}
        </View>
      </View>

      </View>{/* end cardContent */}
    </View>
  );

  if (variant === "list" && onPressCard) {
    return (
      <Pressable
        onPress={onPressCard}
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
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
  },
  birthdayThemeLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  birthdayThemeImage: {
    width: "100%",
    height: "100%",
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
  },
  authorName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: Gray[900],
  },
  timestamp: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
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

  // Menu dropdown
  menuDropdown: {
    position: "absolute",
    right: 16,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    shadowColor: "#131112",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  menuDropdownImg: {
    width: 96,
    height: 36,
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
    borderColor: Gray[100],
    backgroundColor: Gray[50],
    flexDirection: "row",
    alignItems: "stretch",
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
    minWidth: 0,
    overflow: 'hidden',
  },
  worksName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    color: "#000000",
    marginBottom: 4,
  },
  worksMeta: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    color: Gray[500],
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
    marginTop: "auto",
  },
  hashtagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E3DCDF",
    backgroundColor: "#F2EDEF",
  },
  hashtagText: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 14,
    color: "#847B7F",
  },

  // Body
  spoilerContainer: {
    marginTop: 20,
    position: "relative",
  },
  bodySection: {
    overflow: 'hidden',
  },
  imageScroll: {
    paddingHorizontal: 0,
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
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: Gray[800],
  },
  spoilerOverlay: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  reactionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentItem: {
    marginLeft: 16,
  },
  reactionIcon: {
    width: 24,
    height: 24,
  },
  reactionCount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    color: Gray[500],
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  lightboxHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseIcon: {
    width: 24,
    height: 24,
  },
  lightboxCounterText: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#ffffff',
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '600',
  },
});
