import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { C, Gray, Magenta } from '../../../theme'
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

      <View style={styles.canvas}>
        {!hasAnyRank ? (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyText}>아직 선호 해시태그가 없어요...</Text>

            <Pressable
              onPress={() => router.push('/search')}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="검색으로 이동"
            >
              <Image source={findBooksButton} style={styles.emptyButtonImage} contentFit="contain" />
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.rank4, styles.absolute]}>{ranks[4] || ''}</Text>
            <Text style={[styles.rank3, styles.absolute]}>{ranks[3] || ''}</Text>
            <Text style={[styles.rank1, styles.absolute]}>{ranks[1] || ''}</Text>
            <Text style={[styles.rank2, styles.absolute]}>{ranks[2] || ''}</Text>
            <Text style={[styles.rank5, styles.absolute]}>{ranks[5] || ''}</Text>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    backgroundColor: C.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: C.text,
  },
  canvas: {
    position: 'relative',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 361,
    height: 178,
    marginTop: 56,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 40,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: Gray[500],
    textAlign: 'center',
  },
  emptyButtonImage: {
    width: 131,
    height: 36,
    marginTop: 12,
  },
  absolute: {
    position: 'absolute',
  },
  rank4: {
    left: 205,
    top: 0,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: Gray[500],
  },
  rank3: {
    left: 90,
    top: 22.4,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    color: Magenta[200],
  },
  rank1: {
    left: 138,
    top: 47.6,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: Magenta[300],
  },
  rank2: {
    left: 211,
    top: 81.2,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: Magenta[300],
  },
  rank5: {
    left: 120,
    top: 109.2,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Gray[400],
  },
  pressed: {
    opacity: 0.8,
  },
})
