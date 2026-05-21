import { Image } from "expo-image";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { C, Gray } from "../../../theme/colors";
import { Radius } from "../../../theme/radius";
import { Typography } from "../../../theme/typography";

type Props = {
  title?: string;
  meta?: string;
  thumbnailUrl?: string;
  loading?: boolean;
  children?: ReactNode;
};

export function WriteTargetWorkCard({
  title,
  meta,
  thumbnailUrl,
  loading = false,
  children,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.thumbWrap}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumb}
            contentFit="cover"
          />
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title?.trim() || "작품 제목"}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}

        {loading ? (
          <ActivityIndicator
            size="small"
            color={C.primary}
            style={styles.loader}
          />
        ) : null}

        {children ? <View style={styles.childrenSlot}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 2.0: flex items-center gap-3
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbWrap: {
    width: 87,
    height: 116,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Gray[100],
  },
  thumb: {
    width: 87,
    height: 116,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: "flex-start",
    paddingRight: 8,
  },
  // 2.0 review write: body-1-semibold mb-1
  // 2.0 feed write picked-card: heading-4 (= body1Semibold close enough)
  title: {
    ...Typography.body1Semibold,
    color: C.text,
    marginBottom: 4,
  },
  meta: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    marginBottom: 8,
  },
  loader: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  childrenSlot: {
    marginTop: 4,
  },
});
