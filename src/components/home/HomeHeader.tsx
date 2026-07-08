import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme'

const logoBlack = require('../../../assets/icons/common/logo-black.svg')
const searchIcon = require('../../../assets/icons/common/search.svg')
const notificationIcon = require('../../../assets/icons/common/notification.svg')
const notificationActiveIcon = require('../../../assets/notification/icon-notification-active.svg')

type HomeHeaderProps = {
  onSearchPress?: () => void
  onNotificationPress?: () => void
  /** Unread notification count — swaps to the active notification icon when > 0. */
  unreadCount?: number
}

export function HomeHeader({
  onSearchPress,
  onNotificationPress,
  unreadCount = 0,
}: HomeHeaderProps) {
  const hasUnread = unreadCount > 0
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
            source={hasUnread ? notificationActiveIcon : notificationIcon}
            style={styles.icon}
            contentFit="contain"
          />
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
})
