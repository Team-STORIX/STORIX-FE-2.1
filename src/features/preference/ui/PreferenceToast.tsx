import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Shadow, Typography } from '../../../theme'

const checkboxActiveIcon = require('../../../../assets/topicroom/icon-checkbox-active.svg')
const closeIcon = require('../../../../assets/topicroom/icon-delete-medium.svg')

type PreferenceToastProps = {
  message?: string | null
  position?: 'bottom' | 'center'
  bottomOffset?: number
  onClose?: () => void
}

export function PreferenceToast({
  message,
  position = 'bottom',
  bottomOffset = 36,
  onClose,
}: PreferenceToastProps) {
  const insets = useSafeAreaInsets()

  if (!message) return null

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        position === 'bottom'
          ? { justifyContent: 'flex-end', paddingBottom: insets.bottom + bottomOffset }
          : styles.centered,
      ]}
    >
      <View style={styles.toast}>
        <Image
          source={checkboxActiveIcon}
          style={styles.icon}
          contentFit="contain"
        />
        <Text style={styles.text}>{message}</Text>
        <Pressable
          onPress={onClose}
          disabled={!onClose}
          hitSlop={8}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="토스트 닫기"
        >
          <Image
            source={closeIcon}
            style={styles.closeIcon}
            contentFit="contain"
            tintColor={Gray[300]}
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  centered: {
    justifyContent: 'center',
  },
  toast: {
    width: 286,
    maxWidth: '100%',
    height: 48,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: Gray[900],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    ...Shadow.lg,
  },
  icon: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  text: {
    ...Typography.body2Medium,
    color: C.card,
    fontFamily: 'SUIT',
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
})
