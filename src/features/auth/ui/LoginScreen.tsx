import { Alert, Platform, StyleSheet, View, ActivityIndicator, Text, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { developerLogin } from '../api'
import { useNativeSocialLogin } from '../hooks'
import { useAuthStore } from '../../../store/auth.store'
import { C, Typography } from '../../../theme'

const logoWord = require('../../../../assets/logos/logo-word.svg')
const kakaoButton = require('../../../../assets/icons/login/login-kakao.svg')
const naverButton = require('../../../../assets/icons/login/login-naver.svg')
const twitterButton = require('../../../../assets/icons/login/login-twitter.svg')
const appleButton = require('../../../../assets/icons/login/login-apple.svg')

export function LoginScreen() {
  const insets = useSafeAreaInsets()
  const mutation = useNativeSocialLogin()
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens)

  const pendingProvider = mutation.variables
  const pending = mutation.isPending

  const handleDevLogin = async () => {
    try {
      const res = await developerLogin('dev')
      await setLoginTokens({ accessToken: res.result.accessToken })
    } catch {
      Alert.alert('오류', '개발자 로그인에 실패했어요.')
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <Image source={logoWord} style={styles.logoWord} contentFit="contain" />
      </View>

      <View style={styles.buttonGroup}>
        <LoginAssetButton
          source={kakaoButton}
          onPress={() => mutation.mutate('kakao')}
          loading={pending && pendingProvider === 'kakao'}
          disabled={pending}
        />
        <LoginAssetButton
          source={naverButton}
          onPress={() => mutation.mutate('naver')}
          loading={pending && pendingProvider === 'naver'}
          disabled={pending}
        />
        <LoginAssetButton
          source={twitterButton}
          onPress={() => Alert.alert('안내', '트위터 로그인은 아직 지원되지 않아요.')}
          disabled={pending}
        />
        {Platform.OS === 'ios' && (
          <LoginAssetButton
            source={appleButton}
            onPress={() => Alert.alert('안내', 'Apple 로그인은 아직 준비 중이에요.')}
            disabled={pending}
          />
        )}

        {mutation.isError ? (
          <Text style={styles.errorText}>
            {pendingProvider === 'kakao'
              ? '카카오 로그인에 실패했습니다. 다시 시도해 주세요.'
              : '로그인에 실패했습니다. 다시 시도해 주세요.'}
          </Text>
        ) : null}

        {__DEV__ ? (
          <Pressable
            style={({ pressed }) => [
              styles.devButton,
              pending && styles.dimmed,
              pressed && !pending && styles.pressed,
            ]}
            onPress={handleDevLogin}
            disabled={pending}
          >
            <Text style={styles.devButtonText}>개발자 로그인</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function LoginAssetButton({
  source,
  onPress,
  loading = false,
  disabled = false,
}: {
  source: number
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}) {
  // A non-loading button still gets disabled while a sibling provider is pending,
  // so its visual feedback should make that clear without looking "broken":
  // dim it slightly. Loading buttons keep full opacity so the spinner reads cleanly.
  const dimmed = disabled && !loading
  return (
    <Pressable
      style={({ pressed }) => [
        styles.assetButton,
        dimmed && styles.dimmed,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Image source={source} style={styles.assetButtonImage} contentFit="contain" />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={C.text} />
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  hero: {
    marginTop: 263,
    alignItems: 'center',
  },
  logoWord: {
    width: 120,
    height: 40,
  },
  buttonGroup: {
    marginTop: 64,
    gap: 8,
    width: 360,
  },
  assetButton: {
    width: 360,
    height: 48,
  },
  assetButtonImage: {
    width: 360,
    height: 48,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.caption1Medium,
    color: C.error,
    textAlign: 'center',
    marginTop: 8,
  },
  devButton: {
    marginTop: 8,
    width: 360,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 4,
  },
  devButtonText: {
    ...Typography.body2Bold,
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.82,
  },
  dimmed: {
    opacity: 0.45,
  },
})
