import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { Typography } from '../../theme/typography'

const arrowIcon = require('../../../assets/icons/common/icon-arrow-forward.svg')

type HomeSectionProps = {
  title: string
  children: ReactNode
  withArrow?: boolean
  onArrowPress?: () => void
}

export function HomeSection({
  title,
  children,
  withArrow = true,
  onArrowPress,
}: HomeSectionProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {withArrow ? (
          <Pressable
            onPress={onArrowPress}
            accessibilityRole="button"
            accessibilityLabel="이동"
            hitSlop={8}
            style={styles.arrowBox}
          >
            <Image
              source={arrowIcon}
              style={styles.arrow}
              contentFit="contain"
            />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  title: {
    ...Typography.heading1,
    color: C.text,
    flexShrink: 1,
  },
  arrowBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 24,
    height: 24,
  },
})
