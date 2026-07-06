import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg'
import { OnboardingTopBar } from './OnboardingTopBar'
import { C, Gray, Magenta } from '../../../theme'

const manualImages = [
  require('../../../../assets/manual/manual-1.png'),
  require('../../../../assets/manual/manual-2.png'),
  require('../../../../assets/manual/manual-3.png'),
  require('../../../../assets/manual/manual-4.png'),
]

const progressAssets = [
  require('../../../../assets/manual/progress-indicater-star-1.svg'),
  require('../../../../assets/manual/progress-indicater-star-2.svg'),
  require('../../../../assets/manual/progress-indicater-star-3.svg'),
  require('../../../../assets/manual/progress-indicater-star-4.svg'),
]

const MANUAL_IMAGE_ASPECT_RATIO = 1571 / 2388

const copy: Record<number, { title: string; desc: string }> = {
  1: { title: '실시간 토픽룸', desc: '실시간으로 작품에 대해 이야기해보세요' },
  2: { title: '취향 작품 탐색', desc: '내 취향에 맞는 작품을 빠르게 탐색해보세요' },
  3: { title: '관심 피드', desc: '좋아하는 작품을 소문내고 함께 소통해보세요' },
  4: { title: '나만의 서재', desc: '서재에서 관심 작품에 대한 내 리뷰를 모아보세요' },
}

export function ManualScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const isLast = step === 4
  const footerBottomPadding = insets.bottom + 34
  const gradientHeight = footerBottomPadding + 82

  const handleNext = () => {
    if (!isLast) {
      setStep((prev) => prev + 1)
    } else {
      router.replace('/(tabs)')
    }
  }

  const handleSkip = () => {
    router.replace('/(tabs)')
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <OnboardingTopBar onSkip={isLast ? undefined : handleSkip} />

      <View style={styles.content}>
        <Text style={styles.title}>{copy[step].title}</Text>
        <Text style={styles.desc}>{copy[step].desc}</Text>

        <Image
          source={progressAssets[step - 1]}
          style={styles.progress}
          contentFit="contain"
        />

        <View style={styles.manualImageContainer}>
          <Image
            source={manualImages[step - 1]}
            style={styles.manualImage}
            contentFit="contain"
          />
        </View>
      </View>

      <View pointerEvents="none" style={[styles.footerGradient, { height: gradientHeight }]}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id="manualFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.card} stopOpacity="0" />
              <Stop offset="0.4257" stopColor={C.card} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#manualFade)" />
        </Svg>
      </View>

      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <Pressable onPress={handleNext} style={[styles.nextButton, isLast && styles.startButton]}>
          <Text style={styles.nextButtonText}>
            {isLast ? '탐험 시작하기' : '다음으로'}
          </Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    fontFamily: 'SUITBold',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 33.6,
    color: Gray[900],
    textAlign: 'center',
  },
  desc: {
    marginTop: 5,
    fontFamily: 'SUITMedium',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: Gray[500],
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  progress: {
    marginTop: 20,
    width: 108,
    height: 24,
  },
  manualImageContainer: {
    marginTop: 0,
    alignSelf: 'stretch',
    marginHorizontal: -16,
    paddingHorizontal: 0,
  },
  manualImage: {
    width: '100%',
    aspectRatio: MANUAL_IMAGE_ASPECT_RATIO,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 2,
  },
  footerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  nextButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#100F0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: Magenta[300],
  },
  nextButtonText: {
    fontFamily: 'SUITMedium',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#FFF',
    textAlign: 'center',
  },
})
