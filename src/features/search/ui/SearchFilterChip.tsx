import { Pressable, StyleSheet, Text } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { Typography } from '../../../theme/typography'

const arrowDownIcon = require('../../../../assets/icons/common/arrow-down.svg')

type Props = {
  label: string
  selected: boolean
  onPress: () => void
}

export function SearchFilterChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
      <Image
        source={arrowDownIcon}
        style={[styles.icon, selected && styles.iconSelected]}
        contentFit="contain"
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: C.border,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
  },
  containerSelected: {
    borderColor: C.textSecondary,
  },
  label: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
    marginRight: 4,
  },
  icon: {
    width: 16,
    height: 16,
  },
  iconSelected: {
    transform: [{ rotate: '180deg' }],
  },
  pressed: {
    opacity: 0.75,
  },
})
