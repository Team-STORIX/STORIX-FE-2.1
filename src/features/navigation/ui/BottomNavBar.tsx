import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Typography } from '../../../theme'
import { ReviewWriteBottomSheet } from '../../plus'
import { PlusActionButton } from './PlusActionButton'
import { PlusActionMenu } from './PlusActionMenu'

const navBackground = require('../../../../assets/icons/navbar/navigationbar-background.svg')
const homeActiveIcon = require('../../../../assets/icons/navbar/home-active.svg')
const homeInactiveIcon = require('../../../../assets/icons/navbar/home-inactive.svg')
const feedActiveIcon = require('../../../../assets/icons/navbar/feed-tab-active.svg')
const feedInactiveIcon = require('../../../../assets/icons/navbar/feed-tab-inactive.svg')
const libraryActiveIcon = require('../../../../assets/icons/navbar/library-active.svg')
const libraryInactiveIcon = require('../../../../assets/icons/navbar/library-inactive.svg')
const profileActiveIcon = require('../../../../assets/icons/navbar/profile-active.svg')
const profileInactiveIcon = require('../../../../assets/icons/navbar/profile-inactive.svg')

type NavItem = {
  routeName: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { routeName: 'index', label: '홈' },
  { routeName: 'feed', label: '피드' },
  { routeName: 'library', label: '서재' },
  { routeName: 'profile', label: '프로필' },
]

function iconForRoute(routeName: string, active: boolean) {
  switch (routeName) {
    case 'index':
      return homeActiveIcon && (active ? homeActiveIcon : homeInactiveIcon)
    case 'feed':
      return active ? feedActiveIcon : feedInactiveIcon
    case 'library':
      return active ? libraryActiveIcon : libraryInactiveIcon
    case 'profile':
      return active ? profileActiveIcon : profileInactiveIcon
    default:
      return null
  }
}

export function BottomNavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [isPlusOpen, setIsPlusOpen] = useState(false)
  const [showReviewSheet, setShowReviewSheet] = useState(false)

  useEffect(() => {
    setIsPlusOpen(false)
  }, [state.index])

  const barHeight = 80 + insets.bottom
  // plusNavBottom: navWrap 안에서 사용 — container의 paddingBottom이 이미 insets.bottom을 처리함
  const plusNavBottom = 50
  // plusModalBottom: 모달(전체화면) 안에서 사용 — 직접 device bottom 기준으로 offset 필요
  const plusModalBottom = 50 + insets.bottom
  const menuBottom = 130 + insets.bottom

  const activeRouteName = state.routes[state.index]?.name

  const mappedItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        route: state.routes.find((route) => route.name === item.routeName),
      })).filter((item) => item.route != null),
    [state.routes],
  )

  const handleTabPress = (routeName: string) => {
    const route = state.routes.find((candidate) => candidate.name === routeName)
    if (!route) return

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })

    if (!event.defaultPrevented) {
      navigation.navigate(route.name, route.params)
    }
  }

  const handleFeedWritePress = () => {
    setIsPlusOpen(false)
    router.push('/feed/write' as never)
  }

  const renderTabItem = (routeName: string, label: string) => {
    const route = state.routes.find((candidate) => candidate.name === routeName)
    if (!route) return null

    const options = descriptors[route.key]?.options
    const isFocused = activeRouteName === routeName

    return (
      <Pressable
        key={routeName}
        style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
        onPress={() => handleTabPress(routeName)}
        accessibilityRole="button"
        accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <View style={styles.iconWrap}>
          <Image
            source={iconForRoute(routeName, isFocused)}
            style={styles.icon}
            contentFit="contain"
          />
        </View>
        <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}>
          {label}
        </Text>
      </Pressable>
    )
  }

  return (
    <>
      <View style={[styles.container, { height: barHeight, paddingBottom: insets.bottom }]}>
        <View style={styles.navWrap}>
          <Image source={navBackground} style={styles.background} contentFit="fill" />

          <View style={styles.navContent}>
            <View style={styles.sideGroup}>
              {mappedItems.slice(0, 2).map((item) => renderTabItem(item.routeName, item.label))}
            </View>

            <View style={styles.centerGap} />

            <View style={styles.sideGroup}>
              {mappedItems.slice(2).map((item) => renderTabItem(item.routeName, item.label))}
            </View>
          </View>

          <PlusActionButton
            isOpen={isPlusOpen}
            onPress={() => setIsPlusOpen((prev) => !prev)}
            bottom={plusNavBottom}
          />
        </View>
      </View>

      <Modal transparent animationType="none" visible={isPlusOpen} onRequestClose={() => setIsPlusOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setIsPlusOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="닫기 오버레이"
          />

          <PlusActionMenu
            bottom={menuBottom}
            onReviewPress={() => {
              setIsPlusOpen(false)
              setShowReviewSheet(true)
            }}
            onFeedPress={handleFeedWritePress}
          />

          <PlusActionButton
            isOpen={isPlusOpen}
            onPress={() => setIsPlusOpen(false)}
            bottom={plusModalBottom}
          />
        </View>
      </Modal>

      <ReviewWriteBottomSheet visible={showReviewSheet} onClose={() => setShowReviewSheet(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
  },
  navWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  navContent: {
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  centerGap: {
    flex: 1,
    minWidth: 56,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    ...Typography.caption1Medium,
  },
  tabLabelActive: {
    color: C.text,
  },
  tabLabelInactive: {
    color: Gray[300],
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 84,
  },
  tabPressed: {
    opacity: 0.75,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
})
