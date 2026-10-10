import { Image } from 'expo-image'
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { C } from '../../theme/colors'
import { Typography } from '../../theme/typography'

const warningSource = require('../../../assets/icons/search/warning.png')

type Props = {
  title?: string
  description?: string
  iconSize?: number
  style?: StyleProp<ViewStyle>
}

export function WarningEmptyState({
  title,
  description,
  iconSize = 120,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={warningSource}
        style={{ width: iconSize, height: iconSize, alignSelf: 'center' }}
        contentFit="contain"
      />
      {title || description ? (
        <View style={styles.textGroup}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
    gap: 12,
  },
  textGroup: {
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
    textAlign: 'center',
  },
  description: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
})
