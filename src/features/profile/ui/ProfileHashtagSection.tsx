import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { C, Gray, Magenta , FontFamily, Typography } from '../../../theme'
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
    paddingVertical: 28,
    borderBottomWidth: 6,
    borderBottomColor: C.bg,
    backgroundColor: C.card,
  },
  title: {
    ...Typography.heading3,
    lineHeight: 25.2,
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
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 40,
    ...Typography.heading3,
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
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22.4,
    color: Gray[500],
    opacity: 0.5,
  },
  rank3: {
    left: 90,
    top: 22.4,
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 25.2,
    color: Magenta[200],
    opacity: 0.5,
  },
  rank1: {
    left: 138,
    top: 47.6,
    ...Typography.heading1,
    lineHeight: 33.6,
    color: Magenta[400],
  },
  rank2: {
    left: 211,
    top: 81.2,
    ...Typography.heading2,
    color: Magenta[300],
    opacity: 0.7,
  },
  rank5: {
    left: 120,
    top: 109.2,
    ...Typography.body2Medium,
    lineHeight: 19.6,
    color: Gray[400],
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
})
