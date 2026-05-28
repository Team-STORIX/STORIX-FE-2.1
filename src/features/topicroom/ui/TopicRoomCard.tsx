import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { TopicRoomItem } from '../api/topicroom.schema'
import { formatTopicRoomSubtitle } from '../api/formatTopicRoomSubtitle'
import { C } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { Typography } from '../../../theme/typography'

const fireIcon = require('../../../../assets/icons/common/fire.svg')
const peopleIcon = require('../../../../assets/icons/common/icon-topicroom-people.svg')
const arrowIcon = require('../../../../assets/icons/common/icon-arrow-forward-small.svg')

type Props = {
  item: TopicRoomItem
  onPress: () => void
  isJoining?: boolean
  hotLabel?: string
}

export function TopicRoomCard({
  item,
  onPress,
  isJoining = false,
  hotLabel = 'HOT',
}: Props) {
  const subtitle = formatTopicRoomSubtitle(item.worksType, item.worksName)
  const initial = (item.worksName || item.topicRoomName || '?').slice(0, 1).toUpperCase()

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      disabled={isJoining}
      accessibilityRole="button"
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.fallbackBg]}>
          <Text style={styles.fallbackText}>{initial}</Text>
        </View>
      )}

      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.chipRow}>
          <View style={styles.hotChip}>
            <Image source={fireIcon} style={styles.icon12} contentFit="contain" />
            <Text style={styles.hotChipText}>{hotLabel}</Text>
          </View>
          <View style={styles.peopleChip}>
            <Image source={peopleIcon} style={styles.icon12} contentFit="contain" />
            <Text style={styles.peopleChipText}>{item.activeUserNumber ?? 0}</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.topicRoomName}
          </Text>
        </View>
      </View>

      <View style={styles.entryButton}>
        {isJoining ? (
          <ActivityIndicator size="small" color={C.card} />
        ) : (
          <Image source={arrowIcon} style={styles.entryIcon} contentFit="contain" />
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 204,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: C.divider,
  },
  fallbackBg: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryMid,
  },
  fallbackText: {
    ...Typography.heading2,
    fontSize: 42,
    color: C.card,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
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
  hotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  peopleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: C.card,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  icon12: {
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
    maxWidth: '84%',
  },
  subtitle: {
    ...Typography.heading2,
    color: C.card,
    marginBottom: 2,
  },
  title: {
    ...Typography.body1Medium,
    color: C.card,
  },
  entryButton: {
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
  entryIcon: {
    width: 18,
    height: 18,
    tintColor: C.card,
  },
  pressed: {
    opacity: 0.88,
  },
})
