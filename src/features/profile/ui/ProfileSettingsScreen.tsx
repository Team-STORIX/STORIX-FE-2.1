import { useState } from 'react'
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { C } from '../../../theme'
import { useLogoutAction, useSocialProvider } from '../hooks'
import { SettingsSection } from './SettingsSection'


const backIcon = require('../../../../assets/icons/common/back.svg')

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'
const VERSION_DATE = '26.05.07'
const VERSION_LABEL = VERSION_DATE ? `버전 ${APP_VERSION} (${VERSION_DATE})` : `버전 ${APP_VERSION}`
// 최신 버전 배포 시 이 값을 업데이트
const LATEST_VERSION = APP_VERSION

export function ProfileSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isPending: isLoggingOut, logout } = useLogoutAction()
  const socialProviderName = useSocialProvider()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [isLatestVersion, setIsLatestVersion] = useState(true)


  const confirmLogout = () => setShowLogoutModal(true)

  const handleVersionPress = () => {
    setIsLatestVersion(APP_VERSION === LATEST_VERSION)
    setShowVersionModal(true)
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBarOuter, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarInner}>
          <Pressable
            onPress={() => router.replace('/(tabs)/profile')}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
          >
            <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.topBarTitle}>설정</Text>
        </View>
      </View>

      <View style={styles.content}>
        <SettingsSection
          title="앱 설정"
          items={[
            { label: '알림 설정', hasArrow: true, onPress: () => {} },
          ]}
        />

        <View style={styles.divider} />

        <SettingsSection
          title="이용 안내"
          items={[
            {
              label: '버전 관리',
              hasArrow: true,
              rightLabel: VERSION_LABEL,
              rightLabelVariant: 'version',
              onPress: handleVersionPress,
            },
            { label: '문의하기', hasArrow: true, onPress: () => {} },
            { label: '개인정보 처리 방침', hasArrow: true, onPress: () => router.push('/profile/privacy-policy') },
            { label: '서비스 이용약관', hasArrow: true, onPress: () => router.push('/profile/terms-of-service') },
          ]}
        />

        <View style={styles.divider} />

        <SettingsSection
          title="계정"
          items={[
            {
              label: '소셜 로그인',
              rightLabel: socialProviderName ?? undefined,
              rightLabelVariant: 'social',
            },
            {
              label: isLoggingOut ? '로그아웃 중...' : '로그아웃',
              hasArrow: true,
              onPress: confirmLogout,
            },
            {
              label: '회원 탈퇴',
              hasArrow: true,
              onPress: () => router.push('/profile/withdraw'),
            },
          ]}
        />
      </View>

      <Modal
        visible={showVersionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVersionModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>앱 버전 정보</Text>
            <Text style={styles.modalBody}>
              {isLatestVersion
                ? '현재 최신 버전을 사용하고 있어요'
                : '최신 버전으로 다운받아주세요'}
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowVersionModal(false)}
                style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.confirmLabel}>확인</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>로그아웃</Text>
            <Text style={styles.modalBody}>로그아웃하시겠습니까?</Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelLabel}>취소</Text>
              </Pressable>
              <Pressable
                onPress={() => { setShowLogoutModal(false); void logout() }}
                style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.logoutLabel}>로그아웃</Text>
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
  content: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEDED',
  },
  pressed: {
    opacity: 0.7,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 306,
    paddingTop: 28,
    paddingBottom: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  modalTitle: {
    paddingHorizontal: 24,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#131112',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalBody: {
    paddingHorizontal: 24,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    color: '#847B7F',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalButtons: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3DCDF',
    backgroundColor: '#F9F6F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#484245',
  },
  logoutButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: '#131112',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#FFF',
  },
  confirmButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: '#131112',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#FFF',
  },
})
