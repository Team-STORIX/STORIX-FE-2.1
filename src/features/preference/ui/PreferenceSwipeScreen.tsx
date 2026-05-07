import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { C, Gray, Typography } from '../../../theme'
import {
  type PreferenceWork,
  usePreferenceFlow,
} from '../hooks/usePreferenceFlow'
import {
  PreferenceCard,
  type PreferenceCardHandle,
  type PreferenceSwipeDir,
} from './PreferenceCard'
import { PreferenceActionButtons } from './PreferenceActionButtons'
import { PreferenceProgress } from './PreferenceProgress'

const backIcon = require('../../../../assets/icons/common/back.svg')

type ExitingCardInfo = {
  id: number
  work: PreferenceWork
  dir: PreferenceSwipeDir
  startX: number
  overlayAction: PreferenceSwipeDir
}

const EXIT_MS = 360

function ExitingCard({
  info,
  onDone,
}: {
  info: ExitingCardInfo
  onDone: () => void
}) {
  const translateX = useRef(new Animated.Value(info.startX)).current
  const targetX =
    info.dir === 'like'
      ? Dimensions.get('window').width + 160
      : -(Dimensions.get('window').width + 160)

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: targetX,
      duration: EXIT_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone()
    })
  }, [onDone, targetX, translateX])

  const rotate = translateX.interpolate({
    inputRange: [-216, 0, 216],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  })

  return (
    <View pointerEvents="none" style={styles.exitingWrap}>
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX }, { rotate }],
        }}
      >
        <PreferenceCard work={info.work} overlayAction={info.overlayAction} />
      </Animated.View>
    </View>
  )
}

export function PreferenceSwipeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const {
    works,
    currentIndex,
    currentWork,
    like,
    dislike,
    isDone,
    isLimitedDay,
    isLoading,
    isInitializing,
    isSubmitting,
    errorMessage,
  } = usePreferenceFlow()

  const cardRef = useRef<PreferenceCardHandle | null>(null)
  const [exitingCards, setExitingCards] = useState<ExitingCardInfo[]>([])
  const isAdvancing = exitingCards.length > 0

  const nextWork = useMemo(() => {
    if (currentIndex < 0) return null
    return works[currentIndex + 1] ?? null
  }, [currentIndex, works])

  useEffect(() => {
    if (!isLimitedDay) return
    router.replace('/home/preference' as never)
  }, [isLimitedDay, router])

  useEffect(() => {
    if (!isDone) return
    if (works.length === 0) return
    if (exitingCards.length > 0) return

    router.replace(
      {
        pathname: '/home/preference/result',
        params: { stage: 'complete' },
      } as never,
    )
  }, [exitingCards.length, isDone, router, works.length])

  const handleSwiped = useCallback(
    (dir: PreferenceSwipeDir, startX: number) => {
      if (!currentWork || isSubmitting || isAdvancing) return

      setExitingCards((prev) => [
        ...prev,
        {
          id: currentWork.id,
          work: currentWork,
          dir,
          startX,
          overlayAction: dir,
        },
      ])

      if (dir === 'like') like()
      else dislike()
    },
    [currentWork, dislike, isAdvancing, isSubmitting, like],
  )

  const removeExiting = useCallback((id: number) => {
    setExitingCards((prev) => prev.filter((card) => card.id !== id))
  }, [])

  if ((isLoading || isInitializing) && !currentWork && exitingCards.length === 0) {
    return (
      <View style={[styles.statusScreen, { paddingTop: insets.top }]}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    )
  }

  if (errorMessage && works.length === 0) {
    return (
      <View style={[styles.statusScreen, { paddingTop: insets.top }]}>
        <Text style={styles.statusMessage}>{errorMessage}</Text>
      </View>
    )
  }

  if (!currentWork && exitingCards.length === 0) {
    return (
      <View style={[styles.statusScreen, { paddingTop: insets.top }]}>
        <Text style={styles.statusMessage}>
          오늘 보여드릴 작품이 없어요.
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>

        <Text style={styles.headerTitle}>취향 저격 작품 탐색</Text>
      </View>

      <View style={styles.progressWrap}>
        <PreferenceProgress
          total={works.length}
          currentIndex={currentIndex}
          isDone={isDone}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.stackArea}>
          {nextWork ? (
            <View style={styles.nextCardWrap}>
              <PreferenceCard work={nextWork} />
            </View>
          ) : null}

          {currentWork ? (
            <View style={styles.currentCardWrap}>
              <PreferenceCard
                key={`current-${currentWork.id}`}
                ref={cardRef}
                work={currentWork}
                onSwiped={isAdvancing ? undefined : handleSwiped}
              />
            </View>
          ) : null}

          {exitingCards.map((info) => (
            <ExitingCard
              key={`exit-${info.id}`}
              info={info}
              onDone={() => removeExiting(info.id)}
            />
          ))}
        </View>

        <View
          style={[
            styles.buttonWrap,
            { paddingBottom: Math.max(insets.bottom, 8) + 16 },
          ]}
        >
          <PreferenceActionButtons
            disabled={isSubmitting || isAdvancing}
            onDislike={() => cardRef.current?.swipe('dislike')}
            onLike={() => cardRef.current?.swipe('like')}
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
  header: {
    height: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'SUIT',
  },
  progressWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  stackArea: {
    flex: 1,
    position: 'relative',
    minHeight: 0,
  },
  nextCardWrap: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 0.98 }, { translateY: 6 }],
  },
  currentCardWrap: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ translateY: 6 }],
  },
  exitingWrap: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ translateY: 6 }],
  },
  buttonWrap: {
    marginTop: 16,
  },
  statusScreen: {
    flex: 1,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusMessage: {
    ...Typography.body1Medium,
    color: Gray[500],
    textAlign: 'center',
    fontFamily: 'SUIT',
  },
  pressed: {
    opacity: 0.7,
  },
})
