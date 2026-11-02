import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FooterFadeGradient } from './FooterFadeGradient'
import { OnboardingTopBar } from './OnboardingTopBar'
import { C, Gray, Magenta } from '../../../theme'

const MANUAL_STEPS = [
  {
    title: '실시간 토픽룸',
    desc: '실시간으로 작품에 대해 이야기해보세요',
    image: require('../../../../assets/manual/manual-1.png'),
    progress: require('../../../../assets/manual/progress-indicater-star-1.svg'),
  },
  {
    title: '취향 작품 탐색',
    desc: '내 취향에 맞는 작품을 빠르게 탐색해보세요',
    image: require('../../../../assets/manual/manual-2.png'),
    progress: require('../../../../assets/manual/progress-indicater-star-2.svg'),
  },
  {
    title: '관심 피드',
    desc: '좋아하는 작품을 소문내고 함께 소통해보세요',
    image: require('../../../../assets/manual/manual-3.png'),
    progress: require('../../../../assets/manual/progress-indicater-star-3.svg'),
  },
  {
    title: '나만의 서재',
    desc: '서재에서 관심 작품에 대한 내 리뷰를 모아보세요',
    image: require('../../../../assets/manual/manual-4.png'),
    progress: require('../../../../assets/manual/progress-indicater-star-4.svg'),
  },
] as const

const MANUAL_IMAGE_ASPECT_RATIO = 1571 / 2388

export function ManualScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const current = MANUAL_STEPS[stepIndex]
  const isLast = stepIndex === MANUAL_STEPS.length - 1
  const footerBottomPadding = insets.bottom + 34

  const goHome = () => router.replace('/(tabs)')

  const handleNext = () => {
    if (isLast) {
      goHome()
    } else {
      setStepIndex((prev) => prev + 1)
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <OnboardingTopBar onSkip={isLast ? undefined : goHome} />

      <View style={styles.content}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.desc}</Text>

        <Image source={current.progress} style={styles.progress} contentFit="contain" />

        <View style={styles.manualImageContainer}>
          <Image source={current.image} style={styles.manualImage} contentFit="contain" />
        </View>
      </View>

      <FooterFadeGradient height={footerBottomPadding + 82} gradientId="manualFade" />

      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <Pressable onPress={handleNext} style={[styles.nextButton, isLast && styles.startButton]}>
          <Text style={styles.nextButtonText}>{isLast ? '탐험 시작하기' : '다음으로'}</Text>
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
