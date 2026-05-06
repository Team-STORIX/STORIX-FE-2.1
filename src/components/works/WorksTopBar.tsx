import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'

const backIcon = require('../../../assets/icons/common/back.svg')
const favoriteActiveIcon = require('../../../assets/icons/common/icon-add-active.svg')
const favoriteInactiveIcon = require('../../../assets/icons/common/icon-add-deactive.svg')

type WorksTopBarProps = {
  topInset: number
  isFavorite: boolean
  isBusy?: boolean
  onBack: () => void
  onToggleFavorite: () => void
}

export function WorksTopBar({
  topInset,
  isFavorite,
  isBusy = false,
  onBack,
  onToggleFavorite,
}: WorksTopBarProps) {
  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
        onPress={onToggleFavorite}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? '관심작 해제' : '관심 등록'}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={C.text} />
        ) : (
          <>
            <Image
              source={isFavorite ? favoriteActiveIcon : favoriteInactiveIcon}
              style={styles.favoriteIcon}
              contentFit="contain"
            />
            <Text
              style={[
                styles.favoriteLabel,
                !isFavorite && styles.favoriteLabelInactive,
              ]}
            >
              {isFavorite ? '관심중' : '관심'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.screenH,
    paddingBottom: 10,
    backgroundColor: C.card,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 24,
  },
  favoriteIcon: {
    width: 20,
    height: 20,
  },
  favoriteLabel: {
    ...Typography.body2Medium,
    color: C.text,
  },
  favoriteLabelInactive: {
    color: C.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
})
