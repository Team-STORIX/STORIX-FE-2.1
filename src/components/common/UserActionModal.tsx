import { useEffect, useRef, useState } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Typography } from '../../theme'

const defaultProfileImage = require('../../../assets/placeholders/profile-default.png')
const reportDoneIcon = require('../../../assets/icons/feed/report-done.svg')
const reportAlreadyIcon = require('../../../assets/icons/feed/report-already.svg')
const blockDoneIcon = require('../../../assets/icons/feed/block-done.svg')

type ActionType = 'report' | 'block'
type CompletionKind = 'success' | 'duplicate'

type UserActionModalProps = {
  visible: boolean
  onClose: () => void
  onConfirm: () => Promise<void | CompletionKind>
  profileImageUrl?: string | null
  nickname: string
  type: ActionType
  onError?: (error: unknown) => void
  onSuccess?: () => void
  showCompletionPopup?: boolean
}

export function UserActionModal({
  visible,
  onClose,
  onConfirm,
  profileImageUrl,
  nickname,
  type,
  onError,
  onSuccess,
  showCompletionPopup = true,
}: UserActionModalProps) {
  const isReport = type === 'report'
  const [confirming, setConfirming] = useState(false)
  const [doneVisible, setDoneVisible] = useState(false)
  const [completionKind, setCompletionKind] = useState<CompletionKind>('success')
  const doneOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) {
      setDoneVisible(false)
      setCompletionKind('success')
    }
  }, [visible])

  const showDone = (kind: CompletionKind = 'success') => {
    setCompletionKind(kind)
    setDoneVisible(true)
    Animated.sequence([
      Animated.timing(doneOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(doneOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setDoneVisible(false)
      onClose()
    })
  }

  const handleConfirm = async () => {
    if (confirming) return
    setConfirming(true)
    try {
      const result = await onConfirm()
      if (!showCompletionPopup) {
        onClose()
        requestAnimationFrame(() => onSuccess?.())
        return
      }
      showDone(result === 'duplicate' ? 'duplicate' : 'success')
    } catch (error: unknown) {
      // Surface the failure to the caller; do NOT show the success UI.
      onError?.(error)
      onClose()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* 확인 모달 */}
        {!doneVisible && (
          <Pressable style={styles.backdropTouchable} onPress={onClose}>
            <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
              {/* 타이틀 */}
              <Text style={styles.title}>{isReport ? '신고하기' : '차단하기'}</Text>

              {/* 프로필 영역 */}
              <View style={styles.profileSection}>
                <Image
                  source={profileImageUrl ? { uri: profileImageUrl } : defaultProfileImage}
                  style={styles.profileImage}
                  contentFit="cover"
                />
                <Text style={styles.nickname}>{nickname}</Text>
              </View>

              {/* 설명 */}
              <Text style={styles.description}>
                {isReport ? (
                  <>
                    이 유저를 신고하시겠습니까?{'\n'}
                    접수된 신고는 운영 정책에 따라 검토되며{'\n'}
                    신고 내용에 따라 조치 여부가 결정됩니다.
                  </>
                ) : (
                  <>
                    정말로 위의 유저를 차단하시겠습니까?{'\n'}
                    이 작성자가 피드 및 리뷰에 노출되지 않으며{'\n'}
                    다시 해제하실 수 없습니다.
                  </>
                )}
              </Text>

              {/* 버튼 영역 */}
              <View style={styles.buttonRow}>
                {/* 취소 버튼 */}
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={onClose}
                  disabled={confirming}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </Pressable>

                {/* 확인 버튼 */}
                <Pressable
                  style={({ pressed }) => [
                    styles.confirmButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => void handleConfirm()}
                  disabled={confirming}
                >
                  <Text style={styles.confirmButtonText}>
                    {isReport ? '신고하기' : '차단하기'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}

        {/* 완료 팝업 */}
        {doneVisible && (
          <Animated.View style={[styles.doneWrap, { opacity: doneOpacity }]}>
            <Image
              source={
                isReport
                  ? completionKind === 'duplicate'
                    ? reportAlreadyIcon
                    : reportDoneIcon
                  : blockDoneIcon
              }
              style={styles.doneImage}
              contentFit="contain"
            />
          </Animated.View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: 306,
    backgroundColor: C.card,
    borderRadius: 8,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: Gray[900],
    textAlign: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  nickname: {
    ...Typography.body2Bold,
    color: Gray[500],
    marginLeft: 12,
  },
  description: {
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  cancelButton: {
    width: 135,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body1Medium,
    color: Gray[700],
  },
  confirmButton: {
    width: 135,
    height: 49,
    borderRadius: 8,
    backgroundColor: '#EF433E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  doneWrap: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
  },
  doneImage: {
    width: 320,
    height: 82,
  },
})
