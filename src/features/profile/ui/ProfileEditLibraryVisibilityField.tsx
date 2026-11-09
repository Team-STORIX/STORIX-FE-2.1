import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Typography } from '../../../theme'

const activeIcon = require('../../../../assets/icons/common/active.svg')
const deactiveIcon = require('../../../../assets/icons/common/deactive.svg')

type Props = {
  isPublic: boolean
  disabled?: boolean
  onToggle: () => void
}

const DESCRIPTION =
  '서재가 공개 상태인 경우, 타인의 내 프로필의 서재를 확인할 수 있습니다. 비공개인 경우, 타인에게 서재 목록이 비노출됩니다.'

export function ProfileEditLibraryVisibilityField({ isPublic, disabled = false, onToggle }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>서재 공개</Text>
        <Pressable
          onPress={onToggle}
          disabled={disabled}
          accessibilityRole="switch"
          accessibilityState={{ checked: isPublic, disabled }}
          accessibilityLabel="서재 공개 토글"
          hitSlop={6}
          style={disabled && styles.toggleDisabled}
        >
          <Image
            source={isPublic ? activeIcon : deactiveIcon}
            style={styles.toggleIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
      <Text style={styles.description}>{DESCRIPTION}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Gray[100],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.body1Medium,
    color: C.text,
  },
  toggleIcon: {
    width: 42.33,
    height: 23.089,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  description: {
    marginTop: 8,
    ...Typography.caption1Medium,
    color: Gray[500],
  },
})
