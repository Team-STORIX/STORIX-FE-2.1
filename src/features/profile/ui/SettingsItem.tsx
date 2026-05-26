import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Gray, Magenta } from '../../../theme'

const arrowIcon = require('../../../../assets/icons/common/icon-arrow-forward-small.svg')

type Props = {
  label: string
  hasArrow?: boolean
  rightLabel?: string
  rightLabelVariant?: 'version' | 'social'
  onPress?: () => void
}

export function SettingsItem({ label, hasArrow, rightLabel, rightLabelVariant, onPress }: Props) {
  const rowContent = (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rightGroup}>
        {rightLabel && (
          <Text
            style={[
              styles.rightLabel,
              rightLabelVariant === 'version' ? styles.rightLabelVersion : styles.rightLabelSocial,
            ]}
          >
            {rightLabel}
          </Text>
        )}
        {hasArrow && (
          <Image
            source={arrowIcon}
            style={styles.arrow}
            contentFit="contain"
          />
        )}
      </View>
    </>
  )

  if (hasArrow) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {rowContent}
      </Pressable>
    )
  }

  return <View style={styles.row}>{rowContent}</View>
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#131112',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightLabel: {
    fontSize: 14,
    lineHeight: 19.6,
  },
  rightLabelVersion: {
    fontWeight: '500',
    color: Magenta[300],
  },
  rightLabelSocial: {
    fontFamily: 'SUIT',
    fontWeight: '700',
    color: Gray[400],
    textAlign: 'center',
    marginRight: 4,
  },
  arrow: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.7,
  },
})
