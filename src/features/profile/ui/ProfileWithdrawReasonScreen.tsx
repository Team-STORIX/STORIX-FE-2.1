import { useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme'
import { useWithdrawAccount } from '../hooks'

const backIcon = require('../../../../assets/icons/common/back.svg')
const checkboxIcon = require('../../../../assets/icons/profile/checkbox.svg')
const checkboxPinkIcon = require('../../../../assets/icons/profile/checkbox-pink.svg')

const DETAIL_MAX = 100

const MODAL_BULLETS = [
  '회원님의 취향 데이터가 모두 삭제됩니다',
  '이후에는 추천 기능을 이용할 수 없습니다',
]

type ReasonItem = {
  key: string
  label: string
}

const REASONS: ReasonItem[] = [
  { key: 'LACK_OF_CONTENT', label: '원하는 작품/장르가 부족해서' },
  { key: 'COMMUNITY_MISMATCH', label: '커뮤니티 활동이 맞지 않아서' },
  { key: 'DIFFICULT_TO_USE', label: '사용법이 어려워서' },
  { key: 'LOW_FREQUENCY', label: '이용 빈도가 낮아서' },
  { key: 'OTHER', label: '기타' },
]

export function ProfileWithdrawReasonScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isPending, withdraw } = useWithdrawAccount()
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState('')
  const [showModal, setShowModal] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const toggleReason = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        if (key === 'OTHER') setDetail('')
      } else {
        next.add(key)
        if (key === 'OTHER') {
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
        }
      }
      return next
    })
  }

  const handleWithdraw = () => {
    const reasons = Array.from(selectedKeys)
    const detailValue = selectedKeys.has('OTHER') && detail.trim() ? detail.trim() : undefined
    setShowModal(false)
    void withdraw(reasons, detailValue).catch(() => {
      Alert.alert('오류', '회원 탈퇴 중 오류가 발생했어요. 다시 시도해주세요.')
    })
  }

  const isEnabled = selectedKeys.size > 0 && !isPending

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBarOuter, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarInner}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
          >
            <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.topBarTitle}>회원 탈퇴</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>떠나시는 이유를 알려주실 수 있나요?</Text>
            <Text style={styles.subtitle}>회원님의 소중한 의견이 서비스 개선에 큰 도움이 됩니다.</Text>
          </View>

          <View style={styles.reasonList}>
            {REASONS.map((item) => {
              const isSelected = selectedKeys.has(item.key)
              return (
                <Pressable
                  key={item.key}
                  onPress={() => toggleReason(item.key)}
                  style={({ pressed }) => [styles.reasonRow, pressed && styles.pressed]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <Image
                    source={isSelected ? checkboxPinkIcon : checkboxIcon}
                    style={styles.checkbox}
                    contentFit="contain"
                  />
                  <Text style={styles.reasonText}>{item.label}</Text>
                </Pressable>
              )
            })}
          </View>

          {selectedKeys.has('OTHER') && (
            <View style={styles.detailContainer}>
              <TextInput
                style={styles.detailInput}
                value={detail}
                onChangeText={(text) => setDetail(text.slice(0, DETAIL_MAX))}
                placeholder="기타 의견을 남겨주세요."
                placeholderTextColor={Gray[300]}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{detail.length}/{DETAIL_MAX}</Text>
            </View>
          )}
        </ScrollView>

      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.buttonArea}>
          <Pressable
            onPress={() => setShowModal(true)}
            disabled={!isEnabled}
            style={({ pressed }) => [
              styles.nextButton,
              !isEnabled && styles.nextButtonDisabled,
              pressed && isEnabled && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.nextLabel, !isEnabled && styles.nextLabelDisabled]}>
              {isPending ? '탈퇴 처리 중...' : '다음으로'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>정말 탈퇴하시겠어요?</Text>

            <View style={styles.modalBullets}>
              {MODAL_BULLETS.map((bullet) => (
                <Text key={bullet} style={styles.modalBulletText}>{'• ' + bullet}</Text>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={handleWithdraw}
                style={({ pressed }) => [styles.withdrawButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.withdrawLabel}>탈퇴하기</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowModal(false)}
                style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.keepLabel}>유지하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  topBarOuter: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: C.card,
  },
  topBarInner: {
    position: 'relative',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: C.text,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#131112',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: '#847B7F',
  },
  reasonList: {
    gap: 24,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  reasonText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: Gray[900],
  },
  detailContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E3DCDF',
    borderRadius: 8,
    backgroundColor: '#FFF',
    padding: 16,
    height: 117,
  },
  detailInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: Gray[900],
    padding: 0,
    margin: 0,
  },
  charCount: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: Gray[500],
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  safeBottom: {
    backgroundColor: C.card,
  },
  buttonArea: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  nextButton: {
    height: 49,
    borderRadius: 8,
    backgroundColor: Gray[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Gray[200],
  },
  nextLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#FFF',
  },
  nextLabelDisabled: {
    color: Gray[400],
  },
  pressed: {
    opacity: 0.7,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: '#100F0FB2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 306,
    borderRadius: 8,
    backgroundColor: '#FFF',
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#131112',
    textAlign: 'center',
  },
  modalBullets: {
    marginTop: 20,
    alignItems: 'center',
    gap: 2,
  },
  modalBulletText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    color: '#847B7F',
    textAlign: 'center',
  },
  modalButtons: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  withdrawButton: {
    width: 135,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3DCDF',
    backgroundColor: '#F9F6F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#484245',
  },
  keepButton: {
    width: 135,
    height: 49,
    borderRadius: 8,
    backgroundColor: '#131112',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#FFF',
  },
})
