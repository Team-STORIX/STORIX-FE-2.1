import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C } from '../../../theme'
import { useLogoutAction, useWithdrawAccount } from '../hooks'
import { ProfileSettingsButton } from './ProfileSettingsButton'

const TERMS_URL =
  'https://truth-gopher-09e.notion.site/STORIX-2cae81f7094880c889bfd8300787572a'

const backIcon = require('../../../../assets/icons/common/back.svg')

export function ProfileSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isPending: isLoggingOut, logout } = useLogoutAction()
  const { isPending: isWithdrawing, withdraw } = useWithdrawAccount()

  const openTerms = async () => {
    try {
      await Linking.openURL(TERMS_URL)
    } catch {
      Alert.alert('오류', '이용약관을 열지 못했어요.')
    }
  }

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          void logout()
        },
      },
    ])
  }

  const confirmWithdraw = () => {
    Alert.alert(
      '회원탈퇴',
      '회원 탈퇴 시 계정 정보는 복구할 수 없어요.\n정말 탈퇴하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '회원탈퇴',
          style: 'destructive',
          onPress: () => {
            void withdraw().catch(() => {
              Alert.alert('오류', '회원 탈퇴 중 오류가 발생했어요. 다시 시도해주세요.')
            })
          },
        },
      ],
    )
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
        <ProfileSettingsButton label="이용약관 보러가기" onPress={() => void openTerms()} />

        <View style={styles.bottomActions}>
          <ProfileSettingsButton
            label={isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            onPress={confirmLogout}
            disabled={isLoggingOut || isWithdrawing}
          />
          <ProfileSettingsButton
            label={isWithdrawing ? '탈퇴 처리 중...' : '회원탈퇴'}
            onPress={confirmWithdraw}
            disabled={isWithdrawing || isLoggingOut}
            destructive
          />
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
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  bottomActions: {
    marginTop: 'auto',
    paddingTop: 40,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
})
