import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const peopleIcon = require('../../../../assets/icons/common/icon-topicroom-people.svg')
const menuIcon = require('../../../../assets/icons/common/menu-3dots.svg')

type Props = {
  topInset: number
  title: string
  memberCount?: number
  onBack: () => void
  onPressMenu?: () => void
}

export function TopicRoomTopBar({
  topInset,
  title,
  memberCount,
  onBack,
  onPressMenu,
}: Props) {
  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Image source={backIcon} style={styles.icon} contentFit="contain" />
      </Pressable>

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {typeof memberCount === 'number' ? (
          <View style={styles.memberRow}>
            <Image source={peopleIcon} style={styles.peopleIcon} contentFit="contain" />
            <Text style={styles.memberText}>{memberCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rightSlot}>
        {onPressMenu ? (
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={onPressMenu}
            accessibilityRole="button"
            accessibilityLabel="메뉴"
          >
            <Image source={menuIcon} style={styles.icon} contentFit="contain" />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  title: {
    ...Typography.body1Semibold,
    color: C.text,
    flexShrink: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  peopleIcon: {
    width: 16,
    height: 16,
  },
  memberText: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },
  rightSlot: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
})
