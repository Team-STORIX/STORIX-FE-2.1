import { useState } from 'react'
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { C, Gray } from '../../../theme'
import { getCurrentAppVersion, useCurrentAppVersionCheck } from '../../app-version'
import {
  useAdultVerificationStatus,
  useLogoutAction,
  useSocialProvider,
} from '../hooks'
import {
  ADULT_VERIFICATION_ERROR_CODES,
  getAdultVerificationErrorCode,
} from '../api'
import { SettingsSection } from './SettingsSection'


const backIcon = require('../../../../assets/icons/common/back.svg')

const APP_VERSION = getCurrentAppVersion()
const VERSION_DATE =
  typeof Constants.expoConfig?.extra?.versionDate === 'string'
    ? Constants.expoConfig.extra.versionDate.trim()
    : ''

export function ProfileSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isPending: isLoggingOut, logout } = useLogoutAction()
  const socialProviderName = useSocialProvider()
  const appVersionQuery = useCurrentAppVersionCheck()
  const adultVerification = useAdultVerificationStatus()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [isLatestVersion, setIsLatestVersion] = useState(true)

  const versionLabel = VERSION_DATE ? `버전 ${APP_VERSION} (${VERSION_DATE})` : `버전 ${APP_VERSION}`

  const confirmLogout = () => setShowLogoutModal(true)

  const handleVersionPress = () => {
    const status = appVersionQuery.data?.status
    setIsLatestVersion(status == null || status === 'LATEST')
    setShowVersionModal(true)
  }

  const adultVerificationErrorCode = getAdultVerificationErrorCode(
    adultVerification.error,
  )
  const isUnderage =
    adultVerificationErrorCode === ADULT_VERIFICATION_ERROR_CODES.underage
  const adultVerificationState = adultVerification.status?.state
  const canStartAdultVerification =
    !adultVerification.isLoading &&
    adultVerification.error == null &&
    !isUnderage &&
    adultVerification.status?.canVerify === true &&
    (adultVerificationState === 'NOT_VERIFIED' ||
      adultVerificationState === 'EXPIRED')
  const adultVerificationLabel = adultVerification.isLoading
    ? '확인 중'
    : isUnderage
      ? '이용 불가'
      : adultVerification.error
        ? '확인 실패'
        : adultVerification.status?.state === 'VERIFIED'
          ? '인증 완료'
          : adultVerification.status?.state === 'EXPIRED'
            ? '인증 만료'
            : '미인증'

  const handleAdultVerificationPress = () => {
    if (!canStartAdultVerification) return
    router.push('/profile/adult-verification' as never)
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection
          title="앱 설정"
          items={[
            {
              label: '알림 설정',
              hasArrow: true,
              onPress: () => router.push('/notifications/settings'),
            },
          ]}
        />

        <View style={styles.divider} />

        <SettingsSection
          title="이용 안내"
          items={[
            {
              label: '버전 관리',
              hasArrow: true,
              rightLabel: versionLabel,
              rightLabelVariant: 'version',
              onPress: handleVersionPress,
            },
            { label: '문의하기', hasArrow: true, onPress: () => void Linking.openURL('https://www.notion.so/36be81f709488047bcaded14c994fcd4') },
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
              label: '성인 인증',
              rightLabel: adultVerificationLabel,
              rightLabelVariant: 'status',
              hasArrow: canStartAdultVerification,
              onPress: canStartAdultVerification
                ? handleAdultVerificationPress
                : undefined,
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
      </ScrollView>

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
    backgroundColor: C.divider,
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
    borderRadius: 8,
    backgroundColor: C.card,
  },
  modalTitle: {
    paddingHorizontal: 24,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: C.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalBody: {
    marginTop: 10,
    paddingHorizontal: 24,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    color: Gray[500],
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalButtons: {
    marginTop: 28,
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
    borderColor: C.border,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: Gray[700],
  },
  logoutButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: C.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: C.card,
  },
  confirmButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: C.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: C.card,
  },
})
