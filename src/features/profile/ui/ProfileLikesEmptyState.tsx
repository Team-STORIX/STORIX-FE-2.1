import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { ProfileLikesTab } from './ProfileLikesTabs'
import { Gray, Typography } from '../../../theme'

const warningIcon = require('../../../../assets/icons/profile/warning.svg')
const findBooksButton = require('../../../../assets/icons/profile/find-books.svg')
const findWritersButton = require('../../../../assets/icons/profile/find-writers.svg')

type Props = {
  tab: ProfileLikesTab
}

export function ProfileLikesEmptyState({ tab }: Props) {
  const router = useRouter()

  const title =
    tab === 'works'
      ? '\uc544\uc9c1 \uad00\uc2ec \uc791\ud488 \uc124\uc815\uc744\n\ud558\uc9c0 \uc54a\uc73c\uc168\uc5b4\uc694.'
      : '\uc544\uc9c1 \uad00\uc2ec \uc791\uac00 \uc124\uc815\uc744\n\ud558\uc9c0 \uc54a\uc73c\uc168\uc5b4\uc694.'

  return (
    <View style={styles.container}>
      <Image source={warningIcon} style={styles.warningIcon} contentFit="contain" />
      <Text style={styles.title}>{title}</Text>
      <Pressable
        onPress={() => router.push('/search')}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={'\uac80\uc0c9\uc73c\ub85c \uc774\ub3d9'}
      >
        <Image
          source={tab === 'works' ? findBooksButton : findWritersButton}
          style={styles.buttonImage}
          contentFit="contain"
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 148,
    paddingHorizontal: 24,
  },
  warningIcon: {
    width: 100,
    height: 100,
  },
  title: {
    marginTop: 22,
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'center',
  },
  buttonImage: {
    width: 131,
    height: 36,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.8,
  },
})
