import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import type { OnboardingWork } from '../api'
import { C, Gray, Typography } from '../../../theme'
import { FAVORITE_SKELETON_COUNT, MAX_FAVORITE_COUNT } from '../lib/constants'
import { OnboardingStepHeader, stepHeaderStyles } from './OnboardingStepHeader'

const checkPinkIcon = require('../../../../assets/icons/common/check-pink.svg')

const COLUMNS = 3
const HORIZONTAL_PADDING = 16 // OnboardingScreen scrollContent paddingHorizontal
const COLUMN_GAP = 8

/** 로딩 중에는 썸네일/제목 없는 자리표시 카드를 그린다. */
type GridItem = Pick<OnboardingWork, 'worksId'> & Partial<Omit<OnboardingWork, 'worksId'>>

const skeletonItems: GridItem[] = Array.from({ length: FAVORITE_SKELETON_COUNT }, (_, index) => ({
  worksId: index + 1,
}))

type FavoriteStepProps = {
  works: OnboardingWork[]
  selectedIds: number[]
  onToggle: (id: number) => void
  loading: boolean
}

export function FavoriteStep({ works, selectedIds, onToggle, loading }: FavoriteStepProps) {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS)
  const thumbHeight = Math.floor(cardWidth * (4 / 3))
  const isFull = selectedIds.length >= MAX_FAVORITE_COUNT

  const gridItems: GridItem[] = loading ? skeletonItems : works

  return (
    <View>
      <OnboardingStepHeader
        title="관심있는 작품을 선택해 주세요"
        subtitle={selectedIds.length === 0 ? '선택 작품을 기반으로 피드를 구성해드려요' : undefined}
      />
      {selectedIds.length > 0 ? (
        <View style={styles.countRow}>
          <Text style={[stepHeaderStyles.subtitle, styles.subtitleInRow]}>최대 {MAX_FAVORITE_COUNT}개 선택가능</Text>
          <Text style={styles.count}>({selectedIds.length}/{MAX_FAVORITE_COUNT})</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {gridItems.map((item) => {
          const selected = selectedIds.includes(item.worksId)
          const disabled = !selected && isFull
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
                {item.thumbnailUrl ? (
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={{ width: cardWidth, height: thumbHeight }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ width: cardWidth, height: thumbHeight, backgroundColor: C.divider }} />
                )}
                {selected ? (
                  <>
                    <View style={styles.thumbOverlay} />
                    <Image source={checkPinkIcon} style={styles.checkIcon} contentFit="contain" />
                  </>
                ) : null}
              </View>
              <View style={[styles.metaWrap, { width: cardWidth }]}>
                <Text style={styles.workName} numberOfLines={1}>
                  {item.worksName ?? ''}
                </Text>
                <Text style={styles.workAuthor} numberOfLines={1}>
                  {item.artistName ?? ''}
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
  countRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleInRow: {
    marginTop: 0,
  },
  count: {
    marginLeft: 4,
    ...Typography.body1Medium,
    color: C.primary,
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
    backgroundColor: C.divider,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapSelected: {
    borderColor: C.primary,
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,64,147,0.3)',
  },
  checkIcon: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 20,
    height: 20,
  },
  metaWrap: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  workName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: C.text,
  },
  workAuthor: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: Gray[400],
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.82,
  },
})
