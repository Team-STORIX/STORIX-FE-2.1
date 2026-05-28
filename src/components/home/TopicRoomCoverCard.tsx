import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { TopicRoomItem } from '../../features/topicroom'
import { formatTopicRoomSubtitle } from '../../features/topicroom'
import { C, Gray, Magenta } from '../../theme/colors'
import { Typography } from '../../theme/typography'

const fireIcon = require('../../../assets/icons/common/fire.svg')
const peopleIcon = require('../../../assets/icons/common/icon-topicroom-people.svg')

export const TOPICROOM_CARD_W = 266
export const TOPICROOM_CARD_H = 354

type TopicRoomCoverCardProps = {
  room?: TopicRoomItem
  badgeLabel?: string
  loading?: boolean
  onPress?: () => void
}

export function TopicRoomCoverCard({
  room,
  badgeLabel = 'HOT',
  loading = false,
  onPress,
}: TopicRoomCoverCardProps) {
  if (loading || !room) {
    return (
      <View style={[styles.card, styles.placeholderCard]}>
        <View style={styles.content}>
          <View style={styles.chipRow}>
            <View style={[styles.chip, styles.placeholderChip]} />
            <View style={[styles.chip, styles.placeholderChip]} />
          </View>
          <View style={styles.textBlock}>
            <View style={styles.placeholderTitle} />
            <View style={styles.placeholderSubtitle} />
          </View>
        </View>
      </View>
    )
  }

  const subtitle = formatTopicRoomSubtitle(room.worksType, room.worksName)
  const memberCount = room.activeUserNumber ?? 0

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {room.thumbnailUrl ? (
        <Image
          source={{ uri: room.thumbnailUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.fallbackBg]} />
      )}

      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.chipRow}>
          <View style={[styles.chip, styles.hotChip]}>
            <Image
              source={fireIcon}
              style={styles.fireIcon}
              contentFit="contain"
            />
            <Text style={styles.hotChipText}>{badgeLabel}</Text>
          </View>
          <View style={[styles.chip, styles.peopleChip]}>
            <Image
              source={peopleIcon}
              style={styles.peopleIcon}
              contentFit="contain"
            />
            <Text style={styles.peopleChipText}>{memberCount}</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {room.topicRoomName}
          </Text>
        </View>
      </View>

      <View style={styles.enterButton}>
        <Ionicons name="enter-outline" size={22} color={C.card} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: TOPICROOM_CARD_W,
    height: TOPICROOM_CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Gray[100],
  },
  cardPressed: {
    opacity: 0.92,
  },
  placeholderCard: {
    backgroundColor: Gray[100],
  },
  fallbackBg: {
    backgroundColor: Gray[200],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  hotChip: {
    backgroundColor: Magenta[500],
  },
  peopleChip: {
    backgroundColor: C.card,
  },
  fireIcon: {
    width: 12,
    height: 12,
  },
  peopleIcon: {
    width: 12,
    height: 12,
  },
  hotChipText: {
    ...Typography.caption2Extrabold,
    color: C.card,
    marginLeft: 2,
  },
  peopleChipText: {
    ...Typography.caption2Extrabold,
    color: Magenta[300],
    marginLeft: 2,
  },
  textBlock: {
    maxWidth: 200,
  },
  subtitle: {
    ...Typography.heading2,
    color: C.card,
  },
  title: {
    ...Typography.body1Medium,
    color: C.card,
    marginTop: 2,
  },
  enterButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: Magenta[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.black,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  placeholderChip: {
    width: 40,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  placeholderTitle: {
    width: '78%',
    height: 24,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  placeholderSubtitle: {
    width: '56%',
    height: 18,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginTop: 6,
  },
})
