import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Radius, Typography } from '../../../theme'

type OnboardingMissingScreenProps = {
  title: string
}

/** 온보딩 토큰이 없을 때(비정상 진입) 로그인으로 되돌려 보내는 안내 화면 */
export function OnboardingMissingScreen({ title }: OnboardingMissingScreenProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32 }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>로그인 화면으로 돌아가 다시 진행해 주세요.</Text>
      <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.resetButton}>
        <Text style={styles.resetButtonText}>로그인으로 돌아가기</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading1,
    color: C.text,
  },
  body: {
    marginTop: 8,
    ...Typography.body1Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    width: 200,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    ...Typography.body1Bold,
    color: C.card,
  },
})
