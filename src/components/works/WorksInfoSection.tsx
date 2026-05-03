import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { WorksDetail } from '../../features/works/api/works.api'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'
import { HashtagChip } from '../common/HashtagChip'

const naverWebtoon = require('../../../assets/images/platforms/naverWebtoon.png')
const ridibooks = require('../../../assets/images/platforms/ridibooks.png')
const kakaoWebtoon = require('../../../assets/images/platforms/kakaoWebtoon.png')
const kakaoPage = require('../../../assets/images/platforms/kakaoPage.png')

function platformIcon(platform: string) {
  const value = platform.toLowerCase().replace(/\s/g, '')

  if (value.includes('naver') || value.includes('\uB124\uC774\uBC84')) {
    return naverWebtoon
  }
  if (value.includes('ridi') || value.includes('\uB9AC\uB514')) {
    return ridibooks
  }
  if (
    value.includes('kakao') &&
    (value.includes('webtoon') || value.includes('\uC6F9\uD230'))
  ) {
    return kakaoWebtoon
  }
  if (
    value.includes('kakao') &&
    (value.includes('page') || value.includes('\uD398\uC774\uC9C0'))
  ) {
    return kakaoPage
  }

  return null
}

export function WorksInfoSection({ works }: { works: WorksDetail }) {
  const [expanded, setExpanded] = useState(false)
  const platforms = (works.platforms ?? []).filter((item) => item.trim().length > 0)
  const hashtags = (works.hashtags ?? []).filter((item) => item.trim().length > 0)
  const description = works.description?.trim() ?? ''

  return (
    <View style={styles.container}>
      <SectionTitle title="감상 가능한 곳" />
      {platforms.length === 0 ? (
        <Text style={styles.emptyText}>플랫폼 정보가 아직 없어요.</Text>
      ) : (
        <View style={styles.platformList}>
          {platforms.map((platform) => {
            const icon = platformIcon(platform)
            return (
              <View key={platform} style={styles.platformRow}>
                <View style={styles.platformIconWrap}>
                  {icon ? (
                    <Image source={icon} style={styles.platformIcon} contentFit="cover" />
                  ) : (
                    <Text style={styles.platformFallbackText}>
                      {platform.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.platformLabel}>{platform}</Text>
              </View>
            )
          })}
        </View>
      )}

      <SectionTitle title="작품 소개" />
      {description ? (
        <View>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 6}>
            {description}
          </Text>
          {description.length > 140 ? (
            <Pressable onPress={() => setExpanded((value) => !value)}>
              <Text style={styles.expandText}>{expanded ? '접기' : '더보기'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={styles.emptyText}>작품 소개가 아직 없어요.</Text>
      )}

      <SectionTitle title="키워드" />
      {hashtags.length === 0 ? (
        <Text style={styles.emptyText}>키워드가 아직 없어요.</Text>
      ) : (
        <View style={styles.hashtagWrap}>
          {hashtags.map((tag) => (
            <HashtagChip key={tag} label={tag} />
          ))}
        </View>
      )}
    </View>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: S.screenH,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    ...Typography.heading2,
    color: C.text,
    marginBottom: 12,
    marginTop: 4,
  },
  emptyText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    marginBottom: 28,
  },
  platformList: {
    gap: 10,
    marginBottom: 28,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: C.divider,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformIcon: {
    width: 36,
    height: 36,
  },
  platformFallbackText: {
    ...Typography.caption1Extrabold,
    color: C.primary,
  },
  platformLabel: {
    ...Typography.body1Bold,
    color: C.textSecondary,
  },
  description: {
    ...Typography.body2Medium,
    color: C.textSecondary,
    marginBottom: 8,
  },
  expandText: {
    ...Typography.body2Bold,
    color: C.primary,
    marginBottom: 28,
  },
  hashtagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})
