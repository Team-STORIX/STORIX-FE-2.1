import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'

const logoBlack = require('../../../assets/icons/common/logo-black.svg')
const searchIcon = require('../../../assets/icons/common/search.svg')
const notificationIcon = require('../../../assets/icons/common/notification.svg')

type HomeHeaderProps = {
  nickName?: string | null
  isLoading?: boolean
}

export function HomeHeader({ nickName, isLoading = false }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoWrap}>
          <Image source={logoBlack} style={styles.logo} contentFit="contain" />
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={styles.brandTitle}>STORIX</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {nickName ? `${nickName}님을 위한 오늘의 스토리` : '오늘의 스토리'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionButton}>
          <Image
            source={searchIcon}
            style={styles.actionIcon}
            contentFit="contain"
          />
        </View>
        <View style={styles.actionButton}>
          <Image
            source={notificationIcon}
            style={styles.actionIcon}
            contentFit="contain"
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.screenH,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandTextWrap: {
    marginLeft: 10,
    flexShrink: 1,
    gap: 2,
  },
  brandTitle: {
    ...Typography.body1Bold,
    color: C.text,
    letterSpacing: 0.4,
  },
  brandSubtitle: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
})
