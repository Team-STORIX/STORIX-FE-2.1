import { Image } from 'expo-image'
import type { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Radius, Typography } from '../../theme'

const warningIcon = require('../../../assets/icons/search/warning.png')

type WarningModalProps = {
  visible: boolean
  title: string
  description: ReactNode
  onConfirm: () => void
  confirmLabel?: string
}

export function WarningModal({
  visible,
  title,
  description,
  onConfirm,
  confirmLabel = '확인',
}: WarningModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onConfirm}
    >
      <Pressable style={styles.backdrop} onPress={onConfirm}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.content}>
            <Image source={warningIcon} style={styles.icon} contentFit="contain" />

            <View style={styles.textGroup}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 17, 18, 0.6)',
  },
  card: {
    width: 306,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    backgroundColor: C.card,
    shadowColor: C.black,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  icon: {
    width: 80,
    height: 80,
  },
  textGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'center',
  },
  description: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    borderRadius: Radius.sm,
    backgroundColor: Gray[900],
  },
  confirmText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  pressed: {
    opacity: 0.8,
  },
})
