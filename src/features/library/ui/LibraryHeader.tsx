import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Typography } from '../../../theme'

const searchIcon = require('../../../../assets/icons/common/search.svg')

type Props = {
  onSearchPress: () => void
}

export function LibraryHeader({ onSearchPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 서재</Text>

      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        onPress={onSearchPress}
        accessibilityRole="button"
        accessibilityLabel="검색"
      >
        <Image source={searchIcon} style={styles.icon} contentFit="contain" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: C.card,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.75,
  },
})
