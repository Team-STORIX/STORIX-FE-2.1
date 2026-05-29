import { StyleSheet, Text, View } from 'react-native'
import { C, Gray, Shadow, Typography , FontFamily} from '../../../theme'

type PreferenceToastProps = {
  message?: string | null
  position?: 'bottom' | 'center'
  bottomOffset?: number
}

export function PreferenceToast({
  message,
  position = 'center',
  bottomOffset = 24,
}: PreferenceToastProps) {
  if (!message) return null

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        position === 'bottom'
          ? { justifyContent: 'flex-end', paddingBottom: bottomOffset }
          : styles.centered,
      ]}
    >
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
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
    width: 333,
    maxWidth: '100%',
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Gray[900],
    justifyContent: 'center',
    ...Shadow.lg,
  },
  text: {
    ...Typography.body2Medium,
    color: C.card,
  },
})
