import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { TopicRoomItem } from '../../features/topicroom'
import { formatTopicRoomSubtitle } from '../../features/topicroom'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { Typography } from '../../theme/typography'

const fireIcon = require('../../../assets/icons/common/fire.svg')
const peopleIcon = require('../../../assets/icons/common/icon-topicroom-people.svg')
const arrowIcon = require('../../../assets/icons/common/icon-arrow-forward-small.svg')

type TopicRoomCoverCardProps = {
  room?: TopicRoomItem
  width: number
  badgeLabel: string
  loading?: boolean
  onPress?: () => void
}

export function TopicRoomCoverCard({
  room,
  width,
  badgeLabel,
  loading = false,
  onPress,
}: TopicRoomCoverCardProps) {
  const height = Math.round((354 / 266) * width)

  if (loading || !room) {
    return (
      <View style={[styles.card, styles.placeholderCard, { width, height }]}>
        <View style={styles.placeholderChipRow}>
          <View style={styles.placeholderChip} />
          <View style={[styles.placeholderChip, styles.placeholderChipShort]} />
        </View>
        <View style={styles.placeholderTextBlock}>
          <View style={styles.placeholderTitle} />
          <View style={styles.placeholderSubtitle} />
        </View>
        <View style={styles.placeholderButton} />
      </View>
    )
  }

  const subtitle = formatTopicRoomSubtitle(room.worksType, room.worksName)
  const initial = (room.worksName || room.topicRoomName || '?').slice(0, 1)
  const memberCount = room.activeUserNumber ?? 0

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width, height },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {room.thumbnailUrl ? (
        <Image
          source={{ uri: room.thumbnailUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.fallbackBg]}>
          <Text style={styles.fallbackInitial}>{initial}</Text>
        </View>
      )}

      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.chipRow}>
          <View style={[styles.chip, styles.hotChip]}>
            <Image source={fireIcon} style={styles.fireIcon} contentFit="contain" />
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
        <Image source={arrowIcon} style={styles.enterIcon} contentFit="contain" />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: C.divider,
    justifyContent: 'flex-end',
  },
  cardPressed: {
    opacity: 0.9,
  },
  placeholderCard: {
    padding: 16,
    justifyContent: 'space-between',
  },
  placeholderChipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  placeholderChip: {
    width: 52,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  placeholderChipShort: {
    width: 40,
  },
  placeholderTextBlock: {
    gap: 8,
  },
  placeholderTitle: {
    width: '78%',
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  placeholderSubtitle: {
    width: '56%',
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  placeholderButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  fallbackBg: {
    backgroundColor: C.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    ...Typography.heading1,
    color: C.card,
    fontSize: 42,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
  },
  content: {
    padding: 16,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  hotChip: {
    backgroundColor: C.primary,
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
    color: C.primary,
    marginLeft: 2,
  },
  textBlock: {
    maxWidth: '82%',
    gap: 2,
  },
  subtitle: {
    ...Typography.heading2,
    color: C.card,
  },
  title: {
    ...Typography.body1Medium,
    color: C.card,
  },
  enterButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterIcon: {
    width: 18,
    height: 18,
  },
})
