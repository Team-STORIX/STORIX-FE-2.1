import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Magenta , Typography } from '../../../theme'
import { formatTimeAgo } from '../../../lib/utils/formatTimeAgo'
import type { NotificationItem } from '../api/notification.schema'
import { NotificationIcon } from './NotificationIcon'

type Props = {
  item: NotificationItem
  onPress: (item: NotificationItem) => void
}

/**
 * Single notification row (Figma "알림 기본 레이아웃").
 * Unread rows use the magenta-20 background; read rows are white.
 */
export function NotificationListItem({ item, onPress }: Props) {
  const isUnread = item.read === false

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.row,
        isUnread ? styles.unread : styles.read,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <NotificationIcon
        notificationType={item.notificationType}
        category={item.category}
        size={24}
      />

      <View style={styles.textBlock}>
        {item.title ? (
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        ) : null}
        {item.content ? (
          <Text style={styles.body} numberOfLines={2}>
            {item.content}
          </Text>
        ) : null}
        <Text style={styles.date}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 98,
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  unread: {
    backgroundColor: Magenta[20], // #ffeef6
  },
  read: {
    backgroundColor: C.card, // white — "확인된 알림은 background white로 변경"
  },
  textBlock: {
    flex: 1,
  },
  title: {
        ...Typography.body2Medium,
    color: Gray[900], // #131112
  },
  body: {
    ...Typography.caption1Medium,
    color: Gray[600], // #645c5f
  },
  date: {
    marginTop: 4,
    ...Typography.caption1Medium,
    color: Gray[400], // #b0a5aa
  },
  pressed: {
    opacity: 0.7,
  },
})
