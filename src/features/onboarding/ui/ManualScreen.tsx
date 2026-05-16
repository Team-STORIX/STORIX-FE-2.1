import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { OnboardingTopBar } from './OnboardingTopBar'

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

const nextButton = require('../../../../assets/onboarding/next.svg')
const exploreButton = require('../../../../assets/manual/explore.svg')

const copy: Record<number, { title: string; desc: string }> = {
  1: { title: '실시간 토픽룸', desc: '실시간으로 작품에 대해 이야기해보세요!' },
  2: { title: '취향 작품 탐색', desc: '내 취향에 맞는 작품을 빠르게 모아보세요!' },
  3: { title: '관심 피드', desc: '작품에 대한 이야기를 올릴 수 있는 피드' },
  4: { title: '나만의 서재', desc: '서재에서 내 관심 작품에 대한 리뷰를 모아보세요!' },
}

export function ManualScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const isLast = step === 4

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
    else router.back()
  }

  const handleNext = () => {
    if (!isLast) {
      setStep((prev) => prev + 1)
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <OnboardingTopBar onBack={handleBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{copy[step].title}</Text>
        <Text style={styles.desc}>{copy[step].desc}</Text>

        <Image
          source={progressAssets[step - 1]}
          style={styles.progress}
          contentFit="contain"
        />

        <Image
          source={manualImages[step - 1]}
          style={styles.manualImage}
          contentFit="contain"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 34 }]}>
        <Pressable onPress={handleNext} style={styles.nextPressable}>
          <Image
            source={isLast ? exploreButton : nextButton}
            style={styles.nextImage}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: '#000000',
    textAlign: 'center',
  },
  desc: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#847B7F',
    textAlign: 'center',
  },
  progress: {
    marginTop: 20,
    width: 108,
    height: 24,
  },
  manualImage: {
    marginTop: 16,
    width: '100%',
    aspectRatio: 393 / 500,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  nextPressable: {
    width: '100%',
  },
  nextImage: {
    width: '100%',
    height: 50,
  },
})
