import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { WorksDetail } from '../../lib/api/works/works.api'
import { C } from '../../theme/colors'

function worksTypeLabel(type: string): string {
  if (type === 'WEBTOON') return '웹툰'
  if (type === 'WEBNOVEL') return '웹소설'
  return type
}

export function WorksHero({ works }: { works: WorksDetail }) {
  return (
    <>
      {/* Thumbnail */}
      {works.thumbnailUrl ? (
        <Image
          source={{ uri: works.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]}>
          <Text style={styles.thumbnailFallbackInitial}>
            {(works.worksName ?? '?')[0]}
          </Text>
        </View>
      )}

      {/* Info block */}
      <View style={styles.infoBlock}>
        {/* Title */}
        <Text style={styles.title}>{works.worksName}</Text>

        {/* Type + genre chips */}
        <View style={styles.chipRow}>
          {works.worksType ? (
            <Chip label={worksTypeLabel(works.worksType)} variant="primary" />
          ) : null}
          {works.genre ? <Chip label={works.genre} /> : null}
          {works.ageClassification ? (
            <Chip label={works.ageClassification} variant="outline" />
          ) : null}
        </View>

        {/* Authors */}
        {works.author ? (
          <Text style={styles.author}>글 {works.author}</Text>
        ) : null}
        {works.illustrator ? (
          <Text style={styles.authorSub}>그림 {works.illustrator}</Text>
        ) : null}
        {works.originalAuthor ? (
          <Text style={styles.authorSub}>원작 {works.originalAuthor}</Text>
        ) : null}

        {/* Rating + review count */}
        {(works.avgRating != null || works.reviewCount != null) ? (
          <View style={styles.ratingRow}>
            {works.avgRating != null ? (
              <Text style={styles.ratingText}>★ {works.avgRating.toFixed(1)}</Text>
            ) : null}
            {works.reviewCount != null ? (
              <Text style={styles.reviewCountText}>리뷰 {works.reviewCount}개</Text>
            ) : null}
          </View>
        ) : null}

        {/* Platforms */}
        {works.platforms && works.platforms.length > 0 ? (
          <View style={styles.chipRow}>
            {works.platforms.map((p) => (
              <Chip key={p} label={p} variant="outline" />
            ))}
          </View>
        ) : null}

        {/* Hashtags (first 6) */}
        {works.hashtags && works.hashtags.length > 0 ? (
          <View style={styles.chipRow}>
            {works.hashtags.slice(0, 6).map((h) => (
              <Chip key={h} label={`#${h}`} variant="outline" />
            ))}
          </View>
        ) : null}
      </View>
    </>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

type ChipVariant = 'default' | 'primary' | 'outline'

function Chip({ label, variant = 'default' }: { label: string; variant?: ChipVariant }) {
  return (
    <View
      style={[
        styles.chip,
        variant === 'primary' && styles.chipPrimary,
        variant === 'outline' && styles.chipOutline,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          variant === 'primary' && styles.chipTextPrimary,
          variant === 'outline' && styles.chipTextOutline,
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const THUMB_H = 260
const CHIP_RADIUS = 6

const styles = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: THUMB_H,
    backgroundColor: C.primaryLight,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallbackInitial: {
    fontSize: 72,
    fontWeight: '800',
    color: C.primary,
  },

  infoBlock: {
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },

  chip: {
    backgroundColor: C.divider,
    borderRadius: CHIP_RADIUS,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipPrimary: { backgroundColor: C.primaryLight },
  chipOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: { fontSize: 12, color: C.textSecondary },
  chipTextPrimary: { color: C.primary, fontWeight: '600' },
  chipTextOutline: { color: C.textMuted },

  author: { fontSize: 13, color: C.textSecondary, marginBottom: 2 },
  authorSub: { fontSize: 12, color: C.textMuted, marginBottom: 2 },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  ratingText: { fontSize: 15, fontWeight: '700', color: C.star },
  reviewCountText: { fontSize: 13, color: C.textMuted },
})
