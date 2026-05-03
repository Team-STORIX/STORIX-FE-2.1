import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'

const arrowIcon = require('../../../assets/icons/common/icon-arrow-forward.svg')

type HomeSectionProps = {
  title: string
  children: ReactNode
  withArrow?: boolean
}

export function HomeSection({
  title,
  children,
  withArrow = true,
}: HomeSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {withArrow ? (
          <Image
            source={arrowIcon}
            style={styles.arrow}
            contentFit="contain"
          />
        ) : null}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.screenH,
  },
  title: {
    ...Typography.heading1,
    color: C.text,
    flex: 1,
    marginRight: 12,
  },
  arrow: {
    width: 24,
    height: 24,
  },
})
