import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const logoIcon = require('../../../../assets/icons/common/big-star-pink.svg')

const BULLETS = [
  '회원님의 계정 및 활동 정보가 모두 삭제됩니다.',
  '동일 계정으로 재가입하셔도 이전 데이터는 복원되지 않습니다.',
  '작성하신 게시글, 리뷰, 참여 기록은 복구할 수 없습니다.',
]

export function ProfileWithdrawScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

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

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>탈퇴 전에 꼭 확인해주세요</Text>
          <View style={styles.bullets}>
            {BULLETS.map((bullet) => (
              <Text key={bullet} style={styles.bulletText}>
  {'• ' + bullet}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.logoContainer}>
          <Image source={logoIcon} style={styles.logo} contentFit="contain" />
        </View>

        <View style={[styles.buttonArea, { paddingBottom: insets.bottom + 28 }]}>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => router.push('/profile/withdraw-reason')}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.continueLabel}>계속 진행</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingTop: 24,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: Gray[900],
    textAlign: 'center',
  },
  bullets: {
    marginTop: 12,
  },
  bulletText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    color: Gray[500],
    textAlign: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  buttonArea: {
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  continueButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: Gray[700],
  },
  cancelButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: Gray[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: C.card,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
})
