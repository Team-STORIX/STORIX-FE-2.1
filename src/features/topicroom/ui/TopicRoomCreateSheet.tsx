import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Radius, Shadow, Typography } from '../../../theme'

const MAX_NAME_LENGTH = 30

type Props = {
  visible: boolean
  worksName?: string
  defaultName?: string
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (topicRoomName: string) => void
}

export function TopicRoomCreateSheet({
  visible,
  worksName,
  defaultName,
  isSubmitting = false,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState(defaultName ?? worksName ?? '')

  useEffect(() => {
    if (!visible) return
    setName((defaultName ?? worksName ?? '').slice(0, MAX_NAME_LENGTH))
  }, [defaultName, visible, worksName])

  const trimmed = name.trim()
  const canSubmit = !isSubmitting && trimmed.length > 0

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (!isSubmitting) onClose()
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => {
            if (!isSubmitting) onClose()
          }}
          accessibilityRole="button"
          accessibilityLabel="시트 닫기"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kbWrap}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.title}>새 토픽룸 만들기</Text>
            <Text style={styles.subtitle}>
              아직 이 작품의 토픽룸이 없어요. 첫 번째 토픽룸을 만들어 보세요.
            </Text>

            <Text style={styles.label}>토픽룸 이름</Text>
            <TextInput
              value={name}
              onChangeText={(next) =>
                setName(next.length > MAX_NAME_LENGTH ? next.slice(0, MAX_NAME_LENGTH) : next)
              }
              placeholder={worksName ?? '토픽룸 이름을 입력해주세요'}
              placeholderTextColor={C.textMuted}
              style={styles.input}
              maxLength={MAX_NAME_LENGTH}
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (canSubmit) onConfirm(trimmed)
              }}
            />
            <Text style={styles.counter}>{name.length}/{MAX_NAME_LENGTH}</Text>

            <View style={styles.footer}>
              <Pressable
                onPress={() => {
                  if (!isSubmitting) onClose()
                }}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && !isSubmitting && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelLabel}>취소</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (canSubmit) onConfirm(trimmed)
                }}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  !canSubmit && styles.confirmButtonDisabled,
                  pressed && canSubmit && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={C.card} />
                ) : (
                  <Text style={styles.confirmLabel}>만들고 입장하기</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  kbWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingTop: 24,
    ...Shadow.lg,
  },
  title: {
    ...Typography.heading3,
    color: C.text,
  },
  subtitle: {
    ...Typography.body2Medium,
    color: C.textSecondary,
    marginTop: 6,
    marginBottom: 20,
  },
  label: {
    ...Typography.body2Bold,
    color: C.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: Gray[50],
    paddingHorizontal: 14,
    color: C.text,
    ...Typography.body2Medium,
  },
  counter: {
    ...Typography.caption1Medium,
    color: C.textMuted,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Gray[100],
  },
  cancelLabel: {
    ...Typography.body1Semibold,
    color: C.textSecondary,
  },
  confirmButton: {
    backgroundColor: C.primary,
  },
  confirmButtonDisabled: {
    backgroundColor: C.primaryLight,
  },
  confirmLabel: {
    ...Typography.body1Semibold,
    color: C.card,
  },
  pressed: {
    opacity: 0.85,
  },
})
