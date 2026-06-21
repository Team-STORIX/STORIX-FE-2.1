import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { C, Gray, Radius, Typography } from "../../../theme";
import type { LibraryUiWork } from "./types";

const leftGradient = require("../../../../assets/icons/library/leftGradient.svg");
const rightGradient = require("../../../../assets/icons/library/rightGradient.svg");
const littleStarIcon = require("../../../../assets/icons/common/littleStar.svg");

type Props = {
  data: LibraryUiWork[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onNeedMore?: () => void;
  onPressItem: (item: LibraryUiWork) => void;
};

type LayoutMap = Record<number, { x: number; width: number }>;

export function LibraryGalleryCarousel({
  data,
  hasNextPage = false,
  isFetchingNextPage = false,
  onNeedMore,
  onPressItem,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(screenWidth);
  const layoutsRef = useRef<LayoutMap>({});

  useEffect(() => {
    if (activeIndex > Math.max(0, data.length - 1)) {
      setActiveIndex(Math.max(0, data.length - 1));
    }
  }, [activeIndex, data.length]);

  useEffect(() => {
    if (
      activeIndex >= Math.max(0, data.length - 3) &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      onNeedMore?.();
    }
  }, [activeIndex, data.length, hasNextPage, isFetchingNextPage, onNeedMore]);

  const sidePadding = useMemo(
    () => Math.max((viewportWidth - 150) / 2, 24),
    [viewportWidth],
  );

  const updateActiveFromOffset = (offsetX: number) => {
    const centerX = offsetX + viewportWidth / 2;
    let nearestIndex = activeIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const [indexText, layout] of Object.entries(layoutsRef.current)) {
      const index = Number(indexText);
      const itemCenter = layout.x + layout.width / 2;
      const distance = Math.abs(itemCenter - centerX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    if (nearestIndex !== activeIndex) {
      setActiveIndex(nearestIndex);
    }
  };

  const centerItem = (index: number) => {
    const layout = layoutsRef.current[index];
    if (!layout || !scrollRef.current) return;

    const nextOffset = Math.max(
      0,
      layout.x + layout.width / 2 - viewportWidth / 2,
    );
    scrollRef.current.scrollTo({ x: nextOffset, animated: true });
  };

  const activeItem = data[activeIndex];

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.carouselContent,
          { paddingHorizontal: sidePadding },
        ]}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        onScroll={(event) =>
          updateActiveFromOffset(event.nativeEvent.contentOffset.x)
        }
      >
        {data.map((item, index) => {
          const isActive = index === activeIndex;
          const isLeft = index < activeIndex;

          return (
            <Pressable
              key={item.id}
              onLayout={(event) => {
                layoutsRef.current[index] = {
                  x: event.nativeEvent.layout.x,
                  width: event.nativeEvent.layout.width,
                };
              }}
              style={({ pressed }) => [
                styles.book,
                isActive ? styles.activeBook : styles.inactiveBook,
                pressed && styles.bookPressed,
              ]}
              onPress={() => {
                if (isActive) {
                  onPressItem(item);
                  return;
                }

                setActiveIndex(index);
                requestAnimationFrame(() => centerItem(index));
              }}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              {isActive ? (
                item.thumb ? (
                  <Image
                    source={{ uri: item.thumb }}
                    style={styles.activeCover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.activeCover, styles.coverFallback]} />
                )
              ) : (
                <>
                  <View
                    style={[
                      styles.spine,
                      isLeft ? styles.spineLeft : styles.spineRight,
                    ]}
                  >
                    <Text style={styles.spineText} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <Image
                    source={isLeft ? leftGradient : rightGradient}
                    style={[
                      styles.fold,
                      isLeft ? styles.foldLeft : styles.foldRight,
                    ]}
                    contentFit="fill"
                  />
                </>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {activeItem ? (
        <View style={styles.activeInfo}>
          <Text style={styles.activeTitle} numberOfLines={1}>
            {activeItem.title}
          </Text>
          <Text style={styles.activeMeta} numberOfLines={1}>
            {activeItem.meta}
          </Text>

          <View style={styles.ratingPill}>
            <Image
              source={littleStarIcon}
              style={styles.ratingStar}
              contentFit="contain"
            />
            <Text style={styles.ratingText}>
              {activeItem.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 100,
  },
  carouselContent: {
    alignItems: "center",
    gap: 0,
    paddingTop: 100,
    paddingBottom: 28,
  },
  book: {
    height: 200,
  },
  activeBook: {
    width: 150,
    borderRadius: 4,
    overflow: "hidden",
  },
  inactiveBook: {
    width: 52,
    position: "relative",
  },
  spine: {
    position: "absolute",
    top: 0,
    width: 30,
    height: 200,
    backgroundColor: C.primary,
  },
  spineLeft: {
    left: 0,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  spineRight: {
    left: 22,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  fold: {
    position: "absolute",
    top: 0,
    width: 22,
    height: 200,
  },
  foldLeft: {
    left: 30,
  },
  foldRight: {
    left: 0,
  },
  activeCover: {
    width: 150,
    height: 200,
    borderRadius: 4,
  },
  coverFallback: {
    backgroundColor: C.primaryMid,
  },
  spineText: {
    position: "absolute",
    left: -72,
    top: 88,
    width: 176,
    ...Typography.caption1Medium,
    color: C.card,
    transform: [{ rotate: "90deg" }],
  },
  activeInfo: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 28,
  },
  activeTitle: {
    ...Typography.heading3,
    color: C.text,
    textAlign: "center",
    alignSelf: "stretch",
    marginBottom: 8,
  },
  activeMeta: {
    ...Typography.body1Medium,
    color: Gray[400],
    textAlign: "center",
    alignSelf: "stretch",
    marginBottom: 12,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 4,
    backgroundColor: C.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Gray[200],
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingStar: {
    width: 14,
    height: 14,
  },
  ratingText: {
    ...Typography.caption1Semibold,
    color: C.primary,
  },
  bookPressed: {
    opacity: 0.88,
  },
});
