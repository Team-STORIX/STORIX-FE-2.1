import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { C, Gray, Typography } from '../../../theme'
import { useProfileFavoriteWorksPreview } from '../hooks'

const findBooksButton = require('../../../../assets/icons/profile/find-books.svg')
const nextArrowIcon = require('../../../../assets/icons/common/arrow-next.svg')

const WORK_RENDER_LIMIT = 4

export function ProfilePreferenceSection() {
  const router = useRouter()
  const worksQuery = useProfileFavoriteWorksPreview()

  const works = useMemo(
    () => worksQuery.data?.works.slice(0, WORK_RENDER_LIMIT) ?? [],
    [worksQuery.data?.works],
  )

  const emptySlots = Math.max(0, WORK_RENDER_LIMIT - works.length)

  return (
    <View>
      <View style={[styles.section, styles.worksSection]}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>관심 작품</Text>
            <Text style={styles.count}>{worksQuery.data?.count ?? 0}</Text>
          </View>

          <Pressable
            onPress={() => router.push('/profile/likes')}
            accessibilityRole="button"
          >
            <Image source={nextArrowIcon} style={styles.moreIcon} contentFit="contain" />
          </Pressable>
        </View>

        {(worksQuery.data?.count ?? 0) > 0 ? (
          <View style={styles.worksContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.worksMinWidth}>
                <View style={styles.worksRow}>
                  {works.map((work) => (
                    <View key={work.id} style={styles.workItem}>
                      <View style={styles.workThumbWrap}>
                        {work.imageUrl ? (
                          <Image
                            source={{ uri: work.imageUrl }}
                            style={styles.workThumb}
                            contentFit="cover"
                          />
                        ) : null}
                      </View>
                      <Text style={styles.workTitle} numberOfLines={1}>
                        {work.title}
                      </Text>
                      <Text style={styles.workAuthor} numberOfLines={1}>
                        {work.author}
                      </Text>
                    </View>
                  ))}

                  {Array.from({ length: emptySlots }).map((_, index) => (
                    <View key={`empty-${index}`} style={[styles.workItem, styles.emptyWorkItem]}>
                      <View style={styles.emptyWorkThumb} />
                      <Text style={styles.emptyDot}>.</Text>
                      <Text style={[styles.emptyDot, styles.emptyDotSmall]}>.</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>아직 관심 작품이 없어요...</Text>
            <Pressable
              onPress={() => router.push('/search')}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="작품 찾기"
            >
              <Image source={findBooksButton} style={styles.emptyButtonImage} contentFit="contain" />
            </Pressable>
          </View>
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
  worksSection: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: C.text,
  },
  count: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: Gray[300],
  },
  moreIcon: {
    width: 24,
    height: 24,
  },
  worksContent: {
    marginTop: 24,
    width: '100%',
  },
  worksMinWidth: {
    minWidth: 361,
  },
  worksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  workItem: {
    width: 87,
  },
  workThumbWrap: {
    width: 87,
    height: 116,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: C.border,
  },
  workThumb: {
    width: 87,
    height: 116,
  },
  workTitle: {
    ...Typography.body2Medium,
    marginTop: 7,
    width: 87,
    color: C.text,
  },
  workAuthor: {
    ...Typography.caption1Medium,
    marginTop: 3,
    width: 87,
    color: Gray[400],
  },
  emptyWorkItem: {
    opacity: 0,
  },
  emptyWorkThumb: {
    width: 87,
    height: 116,
    borderRadius: 4,
  },
  emptyDot: {
    marginTop: 7,
    width: 87,
  },
  emptyDotSmall: {
    marginTop: 3,
  },
  emptyState: {
    marginTop: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: Gray[500],
  },
  emptyButtonImage: {
    width: 131,
    height: 36,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.8,
  },
})
