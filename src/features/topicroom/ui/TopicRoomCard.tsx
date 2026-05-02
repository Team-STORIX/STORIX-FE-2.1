import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { TopicRoomItem } from '../api/topicroom.api'
import { C } from '../../../theme/colors'

function worksTypeLabel(type?: string | null): string | null {
  if (type === 'WEBTOON') return '웹툰'
  if (type === 'WEBNOVEL') return '웹소설'
  return null
}

function formatSubtitle(item: TopicRoomItem): string {
  const typeLabel = worksTypeLabel(item.worksType)
  return typeLabel ? `${typeLabel} · ${item.worksName}` : item.worksName
}

type Props = {
  item: TopicRoomItem
  onPress: () => void
  isJoining?: boolean
}

export function TopicRoomCard({ item, onPress, isJoining }: Props) {
  const initial = (item.worksName || item.topicRoomName || '?')[0].toUpperCase()

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      disabled={isJoining}
      accessibilityRole="button"
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumbImg}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.thumbInitial}>{initial}</Text>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.roomName} numberOfLines={1}>
          {item.topicRoomName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {formatSubtitle(item)}
        </Text>

        {/* Badges row */}
        <View style={styles.badgeRow}>
          {item.isJoined ? (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedBadgeText}>참여 중</Text>
            </View>
          ) : null}
          {item.activeUserNumber != null && item.activeUserNumber > 0 ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>{item.activeUserNumber}명</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right: join indicator */}
      <View style={styles.right}>
        {isJoining ? (
          <ActivityIndicator size="small" color={C.primary} />
        ) : item.isJoined ? (
          <Text style={styles.chevron}>›</Text>
        ) : (
          <View style={styles.joinBtn}>
            <Text style={styles.joinBtnText}>입장</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const THUMB_SIZE = 54

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  cardPressed: { opacity: 0.75 },

  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbImg: { width: THUMB_SIZE, height: THUMB_SIZE },
  thumbInitial: { fontSize: 22, fontWeight: '800', color: C.primary },

  body: { flex: 1, gap: 3 },
  roomName: { fontSize: 14, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 12, color: C.textMuted },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },

  joinedBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  joinedBadgeText: { fontSize: 10, fontWeight: '700', color: C.primary },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.activeDot,
  },
  activeBadgeText: { fontSize: 11, color: C.textMuted },

  right: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  chevron: { fontSize: 22, color: C.textMuted, lineHeight: 24 },

  joinBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
})
