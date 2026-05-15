import { useEffect, useRef, useState } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Gray } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'

const reportDoneIcon = require('../../../../assets/icons/feed/report-done.svg')
const defaultProfileImage = require('../../../../assets/placeholders/profile-default.png')

type Props = {
  visible: boolean
  profileImageUrl?: string | null
  nickname: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ReportModal({ visible, profileImageUrl, nickname, onClose, onConfirm }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [doneVisible, setDoneVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const doneOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) {
      setDoneVisible(false)
      setToastMessage('')
    }
  }, [visible])

  const showDone = () => {
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
      await onConfirm()
      showDone()
    } catch (error: any) {
      const isDuplicate = error?.response?.data?.code === 'ALREADY_REPORTED'
        || error?.message?.includes('이미')
      if (isDuplicate) {
        setToastMessage('이미 신고한 유저예요.')
        showDone()
      } else {
        onClose()
      }
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* 신고 확인 모달 */}
        {!doneVisible && (
          <Pressable style={styles.backdropTouchable} onPress={onClose}>
            <Pressable style={styles.card} onPress={() => {}}>
              <Text style={styles.title}>신고하기</Text>
              <Text style={styles.subtitle}>정말로 아래 유저를 신고하시겠습니까?</Text>

              <View style={styles.profileRow}>
                <View style={styles.avatarWrap}>
                  <Image
                    source={profileImageUrl ? { uri: profileImageUrl } : defaultProfileImage}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                </View>
                <Text style={styles.nickname}>{nickname}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                  onPress={onClose}
                  disabled={confirming}
                >
                  <Text style={styles.cancelText}>취소</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
                  onPress={() => void handleConfirm()}
                  disabled={confirming}
                >
                  <Text style={styles.confirmText}>
                    {confirming ? '신고 중...' : '신고하기'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}

        {/* 신고 완료 / 중복 신고 팝업 */}
        {doneVisible && (
          <Animated.View style={[styles.doneWrap, { opacity: doneOpacity }]}>
            {toastMessage ? (
              <View style={styles.toastCard}>
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            ) : (
              <Image source={reportDoneIcon} style={styles.doneImage} contentFit="contain" />
            )}
          </Animated.View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 306,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    color: Gray[900],
  },
  subtitle: {
    marginTop: 4,
    ...Typography.body2Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  profileRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Gray[200],
  },
  avatar: {
    width: 32,
    height: 32,
  },
  nickname: {
    marginLeft: 8,
    ...Typography.body2Medium,
    color: Gray[600],
  },
  actions: {
    marginTop: 'auto',
    paddingTop: 20,
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Typography.body1Medium,
    color: Gray[700],
  },
  confirmBtn: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: '#EF433E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    ...Typography.body1Medium,
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.8,
  },
  doneWrap: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  doneImage: {
    width: 286,
    height: 48,
  },
  toastCard: {
    width: 333,
    height: 56,
    borderRadius: 12,
    backgroundColor: Gray[900],
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  toastText: {
    ...Typography.body2Medium,
    color: '#ffffff',
  },
})
