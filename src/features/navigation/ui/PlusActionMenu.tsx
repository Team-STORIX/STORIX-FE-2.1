import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Radius, Typography } from '../../../theme'

const reviewIcon = require('../../../../assets/icons/navbar/review.svg')
const feedIcon = require('../../../../assets/icons/navbar/feed.svg')

type Props = {
  bottom: number
  onReviewPress: () => void
  onFeedPress: () => void
}

export function PlusActionMenu({
  bottom,
  onReviewPress,
  onFeedPress,
}: Props) {
  return (
    <View style={[styles.wrap, { bottom }]}>
      <View style={styles.menu}>
        <Pressable
          style={({ pressed }) => [styles.item, styles.itemBorder, pressed && styles.pressed]}
          onPress={onReviewPress}
        >
          <Text style={styles.label}>리뷰 작성</Text>
          <Image source={reviewIcon} style={styles.icon} contentFit="contain" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          onPress={onFeedPress}
        >
          <Text style={styles.label}>피드 작성</Text>
          <Image source={feedIcon} style={styles.icon} contentFit="contain" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -81,
    width: 162,
    height: 98,
    zIndex: 55,
  },
  menu: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    shadowColor: C.black,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  label: {
    ...Typography.body1Medium,
    color: C.text,
  },
  icon: {
    width: 28,
    height: 28,
  },
  pressed: {
    opacity: 0.7,
  },
})
