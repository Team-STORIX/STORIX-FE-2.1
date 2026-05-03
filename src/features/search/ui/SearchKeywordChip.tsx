import { Pressable, StyleSheet, Text } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { Typography } from '../../../theme/typography'

const cancelIcon = require('../../../../assets/icons/common/cancel.svg')

type Props = {
  label: string
  onPress: () => void
  onRemove?: () => void
}

export function SearchKeywordChip({ label, onPress, onRemove }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
      {onRemove ? (
        <Pressable
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
          onPress={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          accessibilityRole="button"
          accessibilityLabel={`${label} 삭제`}
        >
          <Image source={cancelIcon} style={styles.icon} contentFit="contain" />
        </Pressable>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: Gray[50],
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
  },
  label: {
    ...Typography.body2Medium,
    color: C.text,
  },
  removeButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  icon: {
    width: 9,
    height: 9,
  },
  pressed: {
    opacity: 0.75,
  },
})
