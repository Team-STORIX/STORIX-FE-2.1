import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { C } from '../../../theme'
import { useLogoutAction, useSocialProvider } from '../hooks'
import { SettingsSection } from './SettingsSection'

const TERMS_URL =
  'https://truth-gopher-09e.notion.site/STORIX-2cae81f7094880c889bfd8300787572a'

const backIcon = require('../../../../assets/icons/common/back.svg')

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'
const VERSION_DATE = '26.05.07'
const VERSION_LABEL = VERSION_DATE ? `버전 ${APP_VERSION} (${VERSION_DATE})` : `버전 ${APP_VERSION}`

export function ProfileSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isPending: isLoggingOut, logout } = useLogoutAction()
  const socialProviderName = useSocialProvider()

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('오류', '페이지를 열지 못했어요.')
    }
  }

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => { void logout() },
      },
    ])
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
              onPress: () => {},
            },
            { label: '문의하기', hasArrow: true, onPress: () => {} },
            { label: '개인정보 처리 방침', hasArrow: true, onPress: () => {} },
            { label: '서비스 이용약관', hasArrow: true, onPress: () => void openUrl(TERMS_URL) },
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
})
