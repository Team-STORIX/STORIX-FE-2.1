import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme'

const logoBlack = require('../../../assets/icons/common/logo-black.svg')
const searchIcon = require('../../../assets/icons/common/search.svg')
const notificationIcon = require('../../../assets/icons/common/notification.svg')

type HomeHeaderProps = {
  onSearchPress?: () => void
  onNotificationPress?: () => void
  /** Unread notification count — renders a small badge when > 0. */
  unreadCount?: number
}

export function HomeHeader({
  onSearchPress,
  onNotificationPress,
  unreadCount = 0,
}: HomeHeaderProps) {
  const hasUnread = unreadCount > 0
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)
  return (
    <View style={styles.header}>
      <View style={styles.logoBox}>
        <Image source={logoBlack} style={styles.logo} contentFit="contain" />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onSearchPress}
          accessibilityRole="button"
          accessibilityLabel="검색"
          hitSlop={8}
          style={styles.iconBox}
        >
          <Image source={searchIcon} style={styles.icon} contentFit="contain" />
        </Pressable>

        <Pressable
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="알림"
          hitSlop={8}
          style={styles.iconBox}
        >
          <Image
            source={notificationIcon}
            style={styles.icon}
            contentFit="contain"
          />
          {hasUnread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {badgeLabel}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  logoBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    color: C.card,
  },
})
