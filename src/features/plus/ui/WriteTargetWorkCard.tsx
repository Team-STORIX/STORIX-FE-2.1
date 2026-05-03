import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Radius, S, Typography } from '../../../theme'

type Props = {
  title: string
  meta?: string
  thumbnailUrl?: string
  loading?: boolean
  label?: string
}

export function WriteTargetWorkCard({
  title,
  meta,
  thumbnailUrl,
  loading = false,
  label = '선택한 작품',
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.content}>
        <View style={styles.thumbWrap}>
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={styles.thumbFallback}>
              <Text style={styles.thumbFallbackText}>{title.trim().charAt(0) || '?'}</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={C.primary} style={styles.loader} />
          ) : meta ? (
            <Text style={styles.meta} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: S.screenH,
    paddingVertical: 16,
    gap: 12,
  },
  label: {
    ...Typography.caption1Extrabold,
    color: C.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Gray[100],
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryLight,
  },
  thumbFallbackText: {
    ...Typography.heading2,
    color: C.primary,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  meta: {
    ...Typography.body2Medium,
    color: C.textSecondary,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
})
