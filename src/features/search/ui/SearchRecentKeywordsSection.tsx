import { Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'
import { SearchKeywordChip } from './SearchKeywordChip'

type Props = {
  items: string[]
  onPressKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  onRemoveAll: () => void
}

export function SearchRecentKeywordsSection({
  items,
  onPressKeyword,
  onRemoveKeyword,
  onRemoveAll,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>최근 검색어</Text>
        <Pressable
          style={({ pressed }) => pressed && styles.pressed}
          onPress={onRemoveAll}
          accessibilityRole="button"
          accessibilityLabel="최근 검색어 전체 삭제"
        >
          <Text style={styles.clearAll}>전체 삭제</Text>
        </Pressable>
      </View>

      {items.length > 0 ? (
        <View style={styles.chips}>
          {items.map((keyword) => (
            <SearchKeywordChip
              key={keyword}
              label={keyword}
              onPress={() => onPressKeyword(keyword)}
              onRemove={() => onRemoveKeyword(keyword)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>최근 검색어가 없어요</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.body1Medium,
    color: C.text,
  },
  clearAll: {
    ...Typography.body2Medium,
    color: Gray[300],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  empty: {
    ...Typography.body2Medium,
    color: Gray[400],
  },
  pressed: {
    opacity: 0.75,
  },
})
