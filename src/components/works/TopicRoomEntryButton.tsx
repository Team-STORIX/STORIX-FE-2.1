import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'

const fireIcon = require('../../../assets/icons/common/fire.svg')
const arrowSmallIcon = require('../../../assets/icons/common/icon-arrow-forward-small.svg')

type TopicRoomEntryButtonProps = {
  bottomInset: number
  hasTopicRoom?: boolean
  isCheckingRoom?: boolean
  onPress: () => void
}

export function TopicRoomEntryButton({
  bottomInset,
  hasTopicRoom = false,
  isCheckingRoom = false,
  onPress,
}: TopicRoomEntryButtonProps) {
  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset + 16 }]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          hasTopicRoom ? styles.buttonActive : styles.buttonInactive,
          (pressed || isCheckingRoom) && styles.pressed,
        ]}
        onPress={onPress}
        disabled={isCheckingRoom}
        accessibilityRole="button"
      >
        {isCheckingRoom ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Image source={fireIcon} style={styles.fireIcon} contentFit="contain" />
        )}
        <Text style={styles.label}>{isCheckingRoom ? '확인 중...' : '토픽룸 입장'}</Text>
        <Image source={arrowSmallIcon} style={styles.arrowIcon} contentFit="contain" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: S.screenH,
    backgroundColor: 'transparent',
  },
  button: {
    minHeight: 56,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowOffset: { width: 8, height: 9 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 4,
  },
  buttonActive: {
    backgroundColor: C.primary,
    shadowColor: '#d11d6b',
  },
  buttonInactive: {
    backgroundColor: C.text,
    shadowColor: '#302f30',
  },
  fireIcon: {
    width: 24,
    height: 24,
  },
  label: {
    ...Typography.body2Bold,
    color: '#fff',
  },
  arrowIcon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.88,
  },
})
