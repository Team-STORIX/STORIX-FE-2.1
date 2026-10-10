import { Image } from 'expo-image'
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import type { AppEventBanner } from '../api'

const HOME_HORIZONTAL_PADDING = 16
const BANNER_ASPECT_RATIO = 360 / 84

type HomeEventBannerProps = {
  banners?: AppEventBanner[]
  onPressBanner: (banner: AppEventBanner, index: number) => void
}

export function HomeEventBanner({
  banners,
  onPressBanner,
}: HomeEventBannerProps) {
  const { width } = useWindowDimensions()
  const bannerWidth = Math.max(0, width - HOME_HORIZONTAL_PADDING * 2)
  const bannerHeight = bannerWidth / BANNER_ASPECT_RATIO

  if (!banners || banners.length === 0) return null

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={banners}
        keyExtractor={(banner) => `app-event-banner-${banner.id}`}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.bannerTitle}
            onPress={() => onPressBanner(item, index)}
            style={({ pressed }) => [
              styles.banner,
              { width: bannerWidth, height: bannerHeight },
              pressed && styles.pressed,
            ]}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              contentFit="contain"
              accessible={false}
            />
          </Pressable>
        )}
        pagingEnabled
        scrollEnabled={banners.length > 1}
        snapToInterval={bannerWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: bannerWidth,
          offset: bannerWidth * index,
          index,
        })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  banner: {
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.9,
  },
})
