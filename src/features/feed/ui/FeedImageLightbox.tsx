import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C } from '../../../theme/colors'

const closeIcon = require('../../../../assets/icons/common/x.svg')

type Props = {
  images: string[]
  initialIndex: number
  onClose: () => void
}

function ZoomableImage({ src, width, isActive, onTap }: {
  src: string
  width: number
  isActive: boolean
  onTap: () => void
}) {
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)

  useEffect(() => {
    if (!isActive) {
      scale.value = withSpring(1)
      savedScale.value = 1
    }
  }, [isActive, scale, savedScale])

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, savedScale.value * event.scale)
    })
    .onEnd(() => {
      savedScale.value = scale.value
      if (scale.value < 1.05) {
        scale.value = withSpring(1)
        savedScale.value = 1
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable onPress={onTap} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View style={[{ width, height: '100%' }, animatedStyle]}>
          <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        </Animated.View>
      </GestureDetector>
    </Pressable>
  )
}

export function FeedImageLightbox({ images, initialIndex, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showControls, setShowControls] = useState(false)
  const { width } = useWindowDimensions()
  const { top } = useSafeAreaInsets()
  const visibleImages = images.slice(0, 3)

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onScroll={(event) => {
            setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))
          }}
          scrollEventThrottle={16}
          style={styles.scroll}
        >
          {visibleImages.map((src, index) => (
            <ZoomableImage
              key={index}
              src={src}
              width={width}
              isActive={currentIndex === index}
              onTap={() => setShowControls((value) => !value)}
            />
          ))}
        </ScrollView>
      </View>

      {showControls && (
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={[styles.header, { top }]}>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={20}>
              <Image source={closeIcon} style={styles.closeIcon} contentFit="contain" tintColor={C.card} />
            </Pressable>
            <Text style={styles.counter} pointerEvents="none">
              {currentIndex + 1}/{visibleImages.length}
            </Text>
          </View>
        </View>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  scroll: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  header: {
    position: 'absolute', left: 0, right: 0, height: 48,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10,
  },
  closeButton: {
    position: 'absolute', top: 2, left: 6, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { width: 24, height: 24 },
  counter: {
    position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center',
    color: C.card, fontFamily: 'SUIT', fontSize: 16, fontWeight: '600',
  },
})
