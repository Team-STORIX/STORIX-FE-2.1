import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { C, Gray, Typography } from '../../../theme'
import { usePreferenceFlow } from '../hooks/usePreferenceFlow'
import { PreferencePrimaryButton } from './PreferencePrimaryButton'
import { PreferenceToast } from './PreferenceToast'

const preferenceGuide = require('../../../../assets/preference/preferenceGuide.webp')

export function PreferenceGuideScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isLoading, isInitializing, isLimitedDay, toastMessage } =
    usePreferenceFlow()

  const isBusy = isLoading || isInitializing

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.copyBlock}>
          <Text style={styles.title}>작품 탐색을 시작해볼까요?</Text>
          <Text style={styles.body}>
            마음에 들면 오른쪽으로{'\n'}
            아니면 왼쪽으로 스와이프하세요!
          </Text>
        </View>

        <Image
          source={preferenceGuide}
          style={styles.illustration}
          contentFit="contain"
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PreferencePrimaryButton
          label="다음으로"
          disabled={isBusy || isLimitedDay}
          onPress={() => {
            if (isBusy || isLimitedDay) return
            router.push('/home/preference/swipe' as never)
          }}
        />
      </View>

      {isBusy ? (
        <View pointerEvents="none" style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      ) : null}

      <PreferenceToast
        message={toastMessage}
        position="center"
        bottomOffset={24}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  copyBlock: {
    marginTop: 96,
    alignItems: 'center',
  },
  title: {
    ...Typography.heading1,
    color: C.text,
    textAlign: 'center',
  },
  body: {
    marginTop: 4,
    ...Typography.body1Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  illustration: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    marginTop: 96,
    transform: [{ translateY: -24 }],
  },
  footer: {
    paddingHorizontal: 16,
  },
  loadingWrap: {
    position: 'absolute',
    right: 24,
    top: 24,
  },
})
