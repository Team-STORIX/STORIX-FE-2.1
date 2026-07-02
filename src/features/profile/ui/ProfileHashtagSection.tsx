import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { usePreferredHashtags } from '../hooks'

const findBooksButton = require('../../../../assets/icons/profile/find-books.svg')

export function ProfileHashtagSection() {
  const router = useRouter()
  const hashtagsQuery = usePreferredHashtags()

  const ranks = useMemo(() => {
    const raw = hashtagsQuery.data ?? {}
    return Object.fromEntries(
      Object.entries(raw).map(([rank, keyword]) => [
        Number(rank),
        keyword ? `#${keyword}` : '',
      ]),
    ) as Record<number, string>
  }, [hashtagsQuery.data])

  const hasAnyRank = useMemo(
    () => Object.values(ranks).some((value) => value.trim().length > 0),
    [ranks],
  )

  return (
    <View style={styles.section}>
      <Text style={styles.title}>선호 해시태그</Text>

      {!hasAnyRank ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>아직 선호 해시태그가 없어요</Text>

          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="작품 찾기"
          >
            <Image source={findBooksButton} style={styles.emptyButtonImage} contentFit="contain" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.canvas}>
          <Text
            style={[styles.rank4, styles.absolute]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {ranks[4] || ''}
          </Text>
          <Text style={[styles.rank3, styles.absolute]}>{ranks[3] || ''}</Text>
          <Text style={[styles.rank1, styles.absolute]}>{ranks[1] || ''}</Text>
          <Text style={[styles.rank2, styles.absolute]}>{ranks[2] || ''}</Text>
          <Text style={[styles.rank5, styles.absolute]}>{ranks[5] || ''}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 100,
    borderBottomWidth: 6,
    borderBottomColor: C.bg,
    backgroundColor: C.card,
  },
  title: {
    ...Typography.heading3,
    color: C.text,
  },
  canvas: {
    position: 'relative',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 361,
    height: 178,
    marginTop: 24,
  },
  emptyState: {
    marginTop: 24,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.heading3,
    color: Gray[500],
    textAlign: 'center',
  },
  emptyButtonImage: {
    width: 131,
    height: 36,
    marginTop: 20,
  },
  absolute: {
    position: 'absolute',
  },
  rank4: {
    right: 73,
    top: 0,
    maxWidth: 220,
    overflow: 'hidden',
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22.4,
    color: Gray[500],
    textAlign: 'right',
  },
  rank3: {
    left: 104,
    top: 25.4,
    fontFamily: 'SUIT',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25.2,
    color: Magenta[200],
  },
  rank1: {
    left: 0,
    right: 0,
    top: 53.6,
    ...Typography.heading1,
    lineHeight: 33.6,
    color: Magenta[400],
    textAlign: 'center',
  },
  rank2: {
    right: 93,
    top: 90.2,
    ...Typography.heading2,
    color: Magenta[300],
    textAlign: 'right',
  },
  rank5: {
    left: 115,
    top: 121.2,
    ...Typography.body2Medium,
    lineHeight: 19.6,
    color: Gray[400],
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
})
