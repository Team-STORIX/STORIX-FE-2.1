import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'
import type { TrendingKeyword } from '../api'

const arrowUpIcon = require('../../../../assets/icons/common/arrow-up.svg')
const arrowDownIcon = require('../../../../assets/icons/common/arrow-down.svg')

type Props = {
  items: TrendingKeyword[]
  isLoading: boolean
  isError: boolean
  onPressKeyword: (keyword: string) => void
}

function TrendingColumn({
  items,
  onPressKeyword,
}: {
  items: TrendingKeyword[]
  onPressKeyword: (keyword: string) => void
}) {
  return (
    <View style={styles.column}>
      {items.map((item) => {
        const status = (item.status ?? '').toUpperCase()
        const isUp = status.includes('UP')
        const isDown = status.includes('DOWN')

        return (
          <Pressable
            key={`${item.rank}-${item.keyword}`}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => onPressKeyword(item.keyword)}
            accessibilityRole="button"
          >
            <View style={styles.keywordWrap}>
              <Text style={[styles.rank, item.rank <= 3 && styles.rankHot]}>
                {item.rank}
              </Text>
              <Text style={styles.keyword} numberOfLines={1}>
                {item.keyword}
              </Text>
            </View>

            {isUp ? (
              <Image source={arrowUpIcon} style={styles.trendIcon} contentFit="contain" />
            ) : isDown ? (
              <Image source={arrowDownIcon} style={styles.trendIcon} contentFit="contain" />
            ) : (
              <View style={styles.trendPlaceholder} />
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

export function SearchTrendingKeywordsSection({
  items,
  isLoading,
  isError,
  onPressKeyword,
}: Props) {
  const top10 = [...items].sort((a, b) => a.rank - b.rank).slice(0, 10)
  const left = top10.slice(0, 5)
  const right = top10.slice(5, 10)

  return (
    <View style={styles.section}>
      <Text style={styles.title}>인기 검색어</Text>

      {isLoading ? (
        <Text style={styles.message}>불러오는 중이에요</Text>
      ) : isError ? (
        <Text style={styles.message}>인기 검색어를 불러오지 못했어요.</Text>
      ) : top10.length === 0 ? (
        <Text style={styles.message}>인기 검색어가 없어요</Text>
      ) : (
        <View style={styles.columns}>
          <TrendingColumn items={left} onPressKeyword={onPressKeyword} />
          <TrendingColumn items={right} onPressKeyword={onPressKeyword} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
  },
  columns: {
    flexDirection: 'row',
    gap: 32,
  },
  column: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  keywordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  rank: {
    ...Typography.body2Bold,
    color: C.text,
    width: 16,
    textAlign: 'center',
  },
  rankHot: {
    color: C.primary,
  },
  keyword: {
    ...Typography.body2Medium,
    color: C.text,
    flex: 1,
  },
  trendIcon: {
    width: 16,
    height: 16,
  },
  trendPlaceholder: {
    width: 16,
    height: 16,
  },
  message: {
    ...Typography.body2Medium,
    color: C.textMuted,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.75,
  },
})
