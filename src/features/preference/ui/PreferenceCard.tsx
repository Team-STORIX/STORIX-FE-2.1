import { Image } from "expo-image";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { C, Gray, Magenta, Radius, Typography } from "../../../theme";
import type { PreferenceWork } from "../hooks/usePreferenceFlow";

export type PreferenceSwipeDir = "like" | "dislike";

// Distance (px) at which a gesture is accepted; also the point at which the
// live stamp reaches full opacity. Mirrors the release threshold in the
// PanResponder below.
const SWIPE_THRESHOLD = 120;

export type PreferenceCardHandle = {
  swipe: (dir: PreferenceSwipeDir) => void;
};

type PreferenceCardProps = {
  work: PreferenceWork;
  onSwiped?: (dir: PreferenceSwipeDir, startX: number) => void;
  overlayAction?: PreferenceSwipeDir | null;
};

export const PreferenceCard = forwardRef<
  PreferenceCardHandle,
  PreferenceCardProps
>(function PreferenceCard({ work, onSwiped, overlayAction = null }, ref) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef(0);
  const swipedRef = useRef(onSwiped);
  swipedRef.current = onSwiped;

  useEffect(() => {
    translateX.setValue(0);
  }, [translateX, work.id]);

  const resetPosition = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !!onSwiped && Math.abs(gestureState.dx) > 6,
        onPanResponderGrant: () => {
          startTimeRef.current = Date.now();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!onSwiped) return;
          translateX.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!onSwiped) return;

          const dx = gestureState.dx;
          const dt = Math.max(1, Date.now() - startTimeRef.current);
          const velocity = (dx / dt) * 1000;
          const threshold = SWIPE_THRESHOLD;
          const velocityThreshold = 800;

          if (dx > threshold || velocity > velocityThreshold) {
            swipedRef.current?.("like", dx);
            return;
          }

          if (dx < -threshold || velocity < -velocityThreshold) {
            swipedRef.current?.("dislike", dx);
            return;
          }

          resetPosition();
        },
        onPanResponderTerminate: resetPosition,
      }),
    [onSwiped, translateX],
  );

  useImperativeHandle(
    ref,
    () => ({
      swipe: (dir: PreferenceSwipeDir) => {
        swipedRef.current?.(dir, 0);
      },
    }),
    [],
  );

  const rotate = translateX.interpolate({
    inputRange: [-216, 0, 216],
    outputRange: ["-12deg", "0deg", "12deg"],
    extrapolate: "clamp",
  });

  // Live gesture opacity: right drag gradually reveals "관심", left drag
  // gradually reveals "삭제". Each reaches full opacity at SWIPE_THRESHOLD.
  // When overlayAction is set (button tap / exit animation) the matching
  // stamp is pinned to full opacity and the other is hidden, so the chosen
  // stamp stays visible through the exit regardless of translateX.
  const gestureLikeOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [translateX],
  );
  const gestureDislikeOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [translateX],
  );

  const likeOpacity: Animated.AnimatedInterpolation<number> | number =
    overlayAction === "like"
      ? 1
      : overlayAction === "dislike"
        ? 0
        : gestureLikeOpacity;
  const dislikeOpacity: Animated.AnimatedInterpolation<number> | number =
    overlayAction === "dislike"
      ? 1
      : overlayAction === "like"
        ? 0
        : gestureDislikeOpacity;

  const hashtags = useMemo(
    () => work.hashtags.filter(Boolean),
    [work.hashtags],
  );

  return (
    <Animated.View
      style={[styles.root, { transform: [{ translateX }, { rotate }] }]}
      {...(onSwiped ? panResponder.panHandlers : {})}
    >
      <View style={styles.frame}>
        {work.imageUrl ? (
          <Image
            source={work.imageUrl}
            style={styles.coverImage}
            contentFit="cover"
            contentPosition="center"
          />
        ) : (
          <View style={styles.coverFallback} />
        )}

        <Svg style={styles.overlayBottom} pointerEvents="none">
          <Defs>
            <LinearGradient id="preferenceShade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#131112" stopOpacity={0} />
              <Stop offset="1" stopColor="#131112" stopOpacity={0.6} />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#preferenceShade)"
          />
        </Svg>
        <View style={styles.overlayBase} />

        <ActionStamp action="like" opacity={likeOpacity} />
        <ActionStamp action="dislike" opacity={dislikeOpacity} />

        <View style={styles.copyBlock}>
          {(work.genre || work.worksType) && (
            <View style={styles.badgeRow}>
              {work.worksType ? (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeLabel}>{work.worksType}</Text>
                </View>
              ) : null}
              {work.genre ? (
                <View style={styles.genreBadge}>
                  <Text style={styles.genreBadgeLabel}>{work.genre}</Text>
                </View>
              ) : null}
            </View>
          )}

          <Text style={styles.title}>{work.title}</Text>

          {work.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {work.description}
            </Text>
          ) : null}

          {hashtags.length > 0 ? (
            <View style={styles.hashtagRow}>
              {hashtags.map((tag, index) => (
                <View
                  key={`${work.id}-tag-${index}`}
                  style={styles.hashtagChip}
                >
                  <Text style={styles.hashtagLabel}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
});

function ActionStamp({
  action,
  opacity,
}: {
  action: PreferenceSwipeDir;
  opacity: Animated.AnimatedInterpolation<number> | number;
}) {
  const isLike = action === "like";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.actionStamp,
        isLike ? styles.likeStamp : styles.dislikeStamp,
        { opacity },
      ]}
    >
      <Text
        style={[
          styles.actionStampText,
          isLike ? styles.likeStampText : styles.dislikeStampText,
        ]}
      >
        {isLike ? "관심" : "삭제"}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    height: "100%",
  },
  frame: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Gray[200],
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: -77,
    width: "141.788%",
    height: "117.778%",
  },
  coverFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Gray[200],
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(19, 17, 18, 0.2)",
  },
  overlayBottom: {
    ...StyleSheet.absoluteFillObject,
  },
  actionStamp: {
    position: "absolute",
    top: 20,
    borderWidth: 10,
    borderRadius: Radius.sm,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    zIndex: 2,
  },
  likeStamp: {
    left: 24,
    borderColor: "#00FF73",
  },
  dislikeStamp: {
    right: 24,
    borderColor: "#FF2E5B",
  },
  actionStampText: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: "700",
    fontFamily: "SUIT",
    letterSpacing: 1,
  },
  likeStampText: {
    color: "#00FF73",
  },
  dislikeStampText: {
    color: "#FF2E5B",
  },
  copyBlock: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Magenta[300],
  },
  typeBadgeLabel: {
    ...Typography.body2Bold,
    color: C.card,
    fontFamily: "SUIT",
  },
  genreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: C.card,
  },
  genreBadgeLabel: {
    ...Typography.body2Bold,
    color: Magenta[300],
    fontFamily: "SUIT",
  },
  title: {
    ...Typography.heading1,
    color: C.card,
    fontFamily: "SUIT",
    letterSpacing: -0.48,
  },
  description: {
    marginTop: 8,
    ...Typography.body1Semibold,
    color: C.card,
    fontFamily: "SUIT",
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    maxHeight: 32,
    overflow: "hidden",
  },
  hashtagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  hashtagLabel: {
    ...Typography.body2Bold,
    color: "rgba(255, 255, 255, 0.95)",
    fontFamily: "SUIT",
  },
});
