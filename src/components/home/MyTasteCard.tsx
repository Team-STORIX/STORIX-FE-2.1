import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Gray, Magenta } from '../../theme/colors'
import { Typography } from '../../theme/typography'

const tasteImage = require('../../../assets/preference/tasteImage.webp')

type MyTasteCardProps = {
  onPress?: () => void
}

export function MyTasteCard({ onPress }: MyTasteCardProps) {
  const Wrapper: any = onPress ? Pressable : View
  const wrapperProps = onPress
    ? {
        onPress,
        accessibilityRole: 'button' as const,
        style: ({ pressed }: { pressed: boolean }) => [
          styles.container,
          pressed && styles.containerPressed,
        ],
      }
    : { style: styles.container }

  return (
    <Wrapper {...wrapperProps}>
      <Image
        source={tasteImage}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="top"
      />
      <Text style={styles.copy}>슥 - 넘기기만 해도 취향이 보여요</Text>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 204,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Gray[100],
    padding: 16,
    justifyContent: 'flex-end',
  },
  containerPressed: {
    opacity: 0.92,
  },
  copy: {
    ...Typography.heading2,
    color: Magenta[50],
  },
})
