import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import type { OnboardingWork } from '../api/onboarding.api'

const checkPink = require('../../../../assets/icons/common/check-pink.svg')

const COLUMNS = 3
const HORIZONTAL_PADDING = 16 // OnboardingScreen scrollContent paddingHorizontal
const COLUMN_GAP = 8

export function FavoriteStep({
  works,
  selectedIds,
  onToggle,
  loading,
}: {
  works: OnboardingWork[]
  selectedIds: number[]
  onToggle: (id: number) => void
  loading: boolean
}) {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor(
    (width - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS,
  )
  const thumbHeight = Math.floor(cardWidth * (4 / 3))

  const gridItems = loading ? Array.from({ length: 18 }).map((_, idx) => ({ worksId: idx + 1 })) : works

  return (
    <View>
      <Text style={styles.title}>관심있는 작품을 선택해 주세요</Text>
      {selectedIds.length === 0 ? (
        <Text style={styles.subtitle}>선택 작품을 기반으로 피드를 구성해드려요</Text>
      ) : (
        <View style={styles.countRow}>
          <Text style={styles.subtitle}>최대 18개 선택가능</Text>
          <Text style={styles.count}>({selectedIds.length}/18)</Text>
        </View>
      )}

      <View style={styles.grid}>
        {gridItems.map((item) => {
          const selected = selectedIds.includes(item.worksId)
          const disabled = !selected && selectedIds.length >= 18
          return (
            <Pressable
              key={item.worksId}
              style={({ pressed }) => [
                { width: cardWidth, height: thumbHeight + 48 },
                pressed && styles.pressed,
                disabled && styles.disabled,
              ]}
              onPress={() => !loading && !disabled && onToggle(item.worksId)}
            >
              <View
                style={[
                  styles.thumbWrap,
                  { width: cardWidth, height: thumbHeight },
                  selected && styles.thumbWrapSelected,
                ]}
              >
                {'thumbnailUrl' in item && item.thumbnailUrl ? (
                  <Image
                    source={{ uri: String(item.thumbnailUrl) }}
                    style={{ width: cardWidth, height: thumbHeight }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ width: cardWidth, height: thumbHeight, backgroundColor: '#F2EDEF' }} />
                )}
                {selected ? (
                  <>
                    <View style={styles.thumbOverlay} />
                    <Image source={checkPink} style={styles.checkIcon} contentFit="contain" />
                  </>
                ) : null}
              </View>
              <View style={[styles.metaWrap, { width: cardWidth }]}>
                <Text style={styles.workName} numberOfLines={1}>
                  {'worksName' in item ? String(item.worksName ?? '') : ''}
                </Text>
                <Text style={styles.workAuthor} numberOfLines={1}>
                  {'artistName' in item ? String(item.artistName ?? '') : ''}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: '#000000',
  },
  subtitle: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#847B7F',
  },
  countRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#FF4093',
  },
  grid: {
    marginTop: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COLUMN_GAP,
    rowGap: 16,
    paddingBottom: 80,
  },
  thumbWrap: {
    borderRadius: 8,
    backgroundColor: '#F2EDEF',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapSelected: {
    borderColor: '#FF4093',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,64,147,0.3)',
  },
  checkIcon: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 24,
    height: 24,
  },
  metaWrap: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  workName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#000000',
  },
  workAuthor: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: '#B0A5AA',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.82,
  },
})
