import { StyleSheet, Text, View } from 'react-native'
import { useRecommendedHashtags } from '../../features/feed/hooks/hashtag'
import { C } from '../../theme/colors'
import { Typography } from '../../theme/typography'
import { HashtagChip } from './HashtagChip'

const FALLBACK_ITEMS = [
  '로맨스',
  '공주',
  '이세계',
  '악녀',
  '판타지',
  '환생',
  '청춘',
]

type HashtagListProps = {
  items?: string[]
  onSelect?: (keyword: string) => void
}

export function HashtagList({ items, onSelect }: HashtagListProps) {
  const { data } = useRecommendedHashtags()

  const resolved =
    items && items.length > 0
      ? items
      : data && data.length > 0
        ? data.map((h) => h.name)
        : FALLBACK_ITEMS

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerText}>이런 키워드, 좋아하실 것 같아요</Text>
      </View>
      <View style={styles.row}>
        {resolved.map((item) => (
          <HashtagChip
            key={item}
            label={item}
            onPress={onSelect ? () => onSelect(item) : undefined}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  headerText: {
    ...Typography.heading1,
    color: C.text,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})
