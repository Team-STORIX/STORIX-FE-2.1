import { useEffect, useMemo, useState } from 'react'
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
import { Image } from 'expo-image'
import { C, Gray, Magenta, Typography } from '../../../theme'

const cancelIcon = require('../../../../assets/icons/common/cancel.svg')
const warningSmallIcon = require('../../../../assets/icons/common/warningSmall.svg')

const TOPIC_NAME_PATTERN = /^[0-9A-Za-z가-힣]{2,10}$/
const MAX_NAME_LENGTH = 10

type Step = 1 | 2 | 3

type Props = {
  visible: boolean
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (topicRoomName: string) => void
}

export function TopicRoomCreateModal({
  visible,
  isSubmitting = false,
  onClose,
  onConfirm,
}: Props) {
  const [step, setStep] = useState<Step>(1)
  const [topicRoomName, setTopicRoomName] = useState('')

  useEffect(() => {
    if (!visible) return
    setStep(1)
    setTopicRoomName('')
  }, [visible])

  const canCreate = useMemo(
    () => TOPIC_NAME_PATTERN.test(topicRoomName),
    [topicRoomName],
  )

  const helperText =
    topicRoomName.length === 0 || !canCreate
      ? '한글,영문,숫자 2~10자까지 입력 가능해요'
      : '사용 가능한 제목이에요'

  const helperColor =
    topicRoomName.length === 0
      ? C.error
      : canCreate
        ? C.activeDot
        : C.error

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="모달 닫기"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kbWrap}
          pointerEvents="box-none"
        >
          <View style={styles.dialog} pointerEvents="auto">
            <View style={styles.header}>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                disabled={isSubmitting}
              >
                <Image source={cancelIcon} style={styles.closeIcon} contentFit="contain" />
              </Pressable>
            </View>

            <View style={styles.body}>
              {step === 1 ? (
                <>
                  <Text style={styles.title}>축하합니다!</Text>
                  <Text style={styles.subtitle}>
                    작품의 첫 입장자예요 🎉{'\n'}
                    함께 이야기할 수 있는 토픽룸을 만들어주세요!
                  </Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.primaryButtonActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setStep(2)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonLabel}>다음으로</Text>
                  </Pressable>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Text style={styles.title}>토픽룸 생성 주의사항</Text>
                  <View style={styles.warnGroup}>
                    <Text style={styles.warnDescription}>
                      모두가 함께 사용하는 커뮤니티예요.{'\n'}
                      아래와 같은 제목은 삼가해주세요.
                    </Text>
                    <View style={styles.warnIconWrap}>
                      <Image
                        source={warningSmallIcon}
                        style={styles.warnIcon}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={styles.warnList}>
                      특정 이용이나 집단을 비방하는 내용{'\n'}
                      비속어, 혐오 표현이 포함된 내용
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.primaryButtonActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setStep(3)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonLabel}>네, 확인했어요.</Text>
                  </Pressable>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Text style={styles.title}>토픽룸 생성하기</Text>
                  <Text style={styles.captionCenter}>
                    토픽룸의 제목을 지정해주세요
                  </Text>

                  <View style={styles.inputWrap}>
                    <TextInput
                      value={topicRoomName}
                      onChangeText={(next) =>
                        setTopicRoomName(
                          next.length > MAX_NAME_LENGTH
                            ? next.slice(0, MAX_NAME_LENGTH)
                            : next,
                        )
                      }
                      placeholder="토픽룸의 제목을 입력해주세요"
                      placeholderTextColor={C.textMuted}
                      maxLength={MAX_NAME_LENGTH}
                      editable={!isSubmitting}
                      style={styles.input}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (canCreate && !isSubmitting) {
                          onConfirm(topicRoomName)
                        }
                      }}
                    />
                    <Text style={[styles.helperText, { color: helperColor }]}>
                      {helperText}
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      canCreate && !isSubmitting
                        ? styles.primaryButtonActive
                        : styles.primaryButtonDisabled,
                      pressed && canCreate && !isSubmitting && styles.pressed,
                    ]}
                    onPress={() => {
                      if (canCreate && !isSubmitting) {
                        onConfirm(topicRoomName)
                      }
                    }}
                    disabled={!canCreate || isSubmitting}
                    accessibilityRole="button"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={C.card} />
                    ) : (
                      <Text
                        style={[
                          styles.primaryButtonLabel,
                          !canCreate && styles.primaryButtonLabelDisabled,
                        ]}
                      >
                        토픽룸 생성하기
                      </Text>
                    )}
                  </Pressable>
                </>
              ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  kbWrap: {
    width: '100%',
    alignItems: 'center',
  },
  dialog: {
    width: '100%',
    maxWidth: 353,
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 18,
    height: 18,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  captionCenter: {
    ...Typography.caption1Medium,
    color: Gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  warnGroup: {
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  warnDescription: {
    ...Typography.body2Medium,
    color: Gray[400],
    textAlign: 'center',
  },
  warnIconWrap: {
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnIcon: {
    width: 40,
    height: 40,
  },
  warnList: {
    ...Typography.caption1Medium,
    color: Magenta[300],
    textAlign: 'center',
  },
  inputWrap: {
    marginTop: 20,
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: Gray[50],
    paddingHorizontal: 16,
    color: C.text,
    ...Typography.body2Medium,
  },
  helperText: {
    ...Typography.caption1Medium,
    marginTop: 8,
  },
  primaryButton: {
    height: 48,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryButtonActive: {
    backgroundColor: C.black,
  },
  primaryButtonDisabled: {
    backgroundColor: Gray[200],
  },
  primaryButtonLabel: {
    ...Typography.body1Medium,
    color: C.card,
  },
  primaryButtonLabelDisabled: {
    color: Gray[400],
  },
  pressed: {
    opacity: 0.85,
  },
})
