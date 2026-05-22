import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Radius, Typography } from '../../../theme'
import { formatTopicRoomSubtitle } from '../api/formatTopicRoomSubtitle'
import type { TopicRoomItem } from '../api/topicroom.schema'

const peopleIcon = require('../../../../assets/icons/common/icon-topicroom-people.svg')

type Props = {
  item: TopicRoomItem
  /** 1-based rank across the full popular list (not per carousel page). */
  rank: number
  isJoining: boolean
  onPress: () => void
}

export function HotTopicRoomCard({ item, rank, isJoining, onPress }: Props) {
  const title = formatTopicRoomSubtitle(item.worksType, item.worksName)
  const initial = (item.worksName || item.topicRoomName || '?').slice(0, 1).toUpperCase()

  return (
    <Pressable
      onPress={onPress}
      disabled={isJoining}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {/* Thumbnail with rank badge */}
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumb}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={styles.thumbFallbackText}>{initial}</Text>
          </View>
        )}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      </View>

      {/* Right content */}
      <View style={styles.body}>
        <View style={styles.participantRow}>
          <Image source={peopleIcon} style={styles.peopleIcon} contentFit="contain" />
          <Text style={styles.participantText}>
            {item.activeUserNumber ?? 0}명 참여중
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.roomName} numberOfLines={1}>
          {item.topicRoomName}
        </Text>
      </View>

      {isJoining ? (
        <ActivityIndicator size="small" color={C.primary} style={styles.joiningSpinner} />
      ) : null}
    </Pressable>
  )
}

const CARD_HEIGHT = 120
const THUMB_WIDTH = 92

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
    backgroundColor: C.card,
    borderRadius: Radius.sm,
    ...Platform.select({
      ios: {
        shadowColor: Gray[900],
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },
  pressed: { opacity: 0.85 },

  thumbWrap: {
    width: THUMB_WIDTH,
    height: CARD_HEIGHT,
    borderTopLeftRadius: Radius.sm,
    borderBottomLeftRadius: Radius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumb: {
    width: THUMB_WIDTH,
    height: CARD_HEIGHT,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryLight,
  },
  thumbFallbackText: {
    ...Typography.heading2,
    color: C.primary,
  },
  rankBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopLeftRadius: Radius.sm,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...Typography.caption1Extrabold,
    color: '#fff',
  },

  body: {
    flex: 1,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    gap: 4,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  peopleIcon: {
    width: 12,
    height: 12,
  },
  participantText: {
    ...Typography.caption2Medium,
    color: C.primary,
  },
  title: {
    ...Typography.body2Bold,
    color: Gray[900],
  },
  roomName: {
    ...Typography.caption1Medium,
    color: Gray[500],
  },

  joiningSpinner: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
})
