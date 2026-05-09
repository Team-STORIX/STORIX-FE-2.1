import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFavoriteWork } from '../../favorite/hooks/useFavoriteWork'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { usePreferenceFlow, type PreferenceWork } from '../hooks/usePreferenceFlow'
import { PreferencePrimaryButton } from './PreferencePrimaryButton'

const backIcon = require('../../../../assets/icons/common/back.svg')
const favoriteActiveIcon = require('../../../../assets/icons/common/icon-add-active.svg')
const favoriteInactiveIcon = require('../../../../assets/icons/common/icon-add-deactive.svg')
const preferenceGuideComplete = require('../../../../assets/preference/preferenceGuide-2.webp')
const finishStar = require('../../../../assets/preference/finishStar.webp')

type ResultStage = 'complete' | 'list' | 'finish'
type Tab = 'like' | 'dislike'

function parseStage(raw?: string | string[]): ResultStage {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'list' || value === 'finish') return value
  return 'complete'
}

function PreferenceResultListRow({ work }: { work: PreferenceWork }) {
  const { onFavoriteAdded, onFavoriteRemoved } = usePreferenceFlow()
  const { isFavorite, isMutating, toggleFavorite } = useFavoriteWork(work.id, {
    onAdded: onFavoriteAdded,
    onRemoved: onFavoriteRemoved,
  })

  const illustrator =
    work.originalAuthor && work.illustrator === work.originalAuthor
      ? ''
      : work.illustrator
  const meta = [work.originalAuthor, illustrator, work.worksType]
    .filter(Boolean)
    .join(' · ')

  return (
    <View style={styles.listRow}>
      <View style={styles.thumbnailWrap}>
        {work.imageUrl ? (
          <Image source={work.imageUrl} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={styles.thumbnailFallback} />
        )}
      </View>

      <View style={styles.listCopy}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {work.title}
        </Text>
        <Text style={styles.listMeta} numberOfLines={1}>
          {meta}
        </Text>
        {work.ratingText ? (
          <Text style={styles.ratingText}>{work.ratingText}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => void toggleFavorite()}
        disabled={isMutating}
        style={({ pressed }) => [
          styles.favoriteButton,
          (pressed || isMutating) && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? '관심 해제' : '관심 추가'}
      >
        <Image
          source={isFavorite ? favoriteActiveIcon : favoriteInactiveIcon}
          style={styles.favoriteIcon}
          contentFit="contain"
        />
      </Pressable>
    </View>
  )
}

function PreferenceListStage({
  tab,
  onTabChange,
}: {
  tab: Tab
  onTabChange: (next: Tab) => void
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { likedWorks, dislikedWorks, isResultsLoading } = usePreferenceFlow()

  const items = useMemo(
    () => (tab === 'like' ? likedWorks : dislikedWorks),
    [dislikedWorks, likedWorks, tab],
  )

  const showLoading =
    isResultsLoading &&
    likedWorks.length === 0 &&
    dislikedWorks.length === 0

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.listHeader}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>

        <Text style={styles.listHeaderTitle}>취향 저격 작품 탐색</Text>

        <Pressable
          onPress={() =>
            router.push(
              {
                pathname: '/home/preference/result',
                params: { stage: 'finish' },
              } as never,
            )
          }
          accessibilityRole="button"
          accessibilityLabel="완료"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Text style={styles.completeLabel}>완료</Text>
        </Pressable>
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => onTabChange('like')}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel="좋아요 탭"
          >
            <Text style={[styles.tabLabel, tab === 'like' ? styles.tabActive : styles.tabInactive]}>
              좋아요
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onTabChange('dislike')}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel="별로에요 탭"
          >
            <Text
              style={[
                styles.tabLabel,
                tab === 'dislike' ? styles.tabActive : styles.tabInactive,
              ]}
            >
              별로에요
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.tabUnderline,
            tab === 'like' ? styles.tabUnderlineLeft : styles.tabUnderlineRight,
          ]}
        />
      </View>

      {showLoading ? (
        <View style={styles.loadingListWrap}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listContent}>
            {items.map((work) => (
              <PreferenceResultListRow key={work.id} work={work} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

function PreferenceCompleteStage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.completeContent}>
        <View style={styles.completeCopy}>
          <Text style={styles.completeTitle}>탐색 완료!</Text>
          <Text style={styles.completeBody}>
            탐색결과를 확인하고,{'\n'}
            마음에 드는 작품을 관심작품으로 등록해봐요
          </Text>
        </View>

        <Image
          source={preferenceGuideComplete}
          style={styles.completeImage}
          contentFit="contain"
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 34 }]}>
        <PreferencePrimaryButton
          label="다음으로"
          onPress={() =>
            router.push(
              {
                pathname: '/home/preference/result',
                params: { stage: 'list' },
              } as never,
            )
          }
        />
      </View>
    </View>
  )
}

function PreferenceFinishStage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { likedSuccessCount } = usePreferenceFlow()

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.finishContent}>
        <View style={styles.finishCopy}>
          <Text style={styles.finishTitle}>축하해요!</Text>
          <Text style={styles.finishBody}>
            {likedSuccessCount}개의 새로운 관심 작품이 등록됐어요!{'\n'}
            피드에서 작품의 소식을 확인해봐요!
          </Text>
        </View>

        <Image source={finishStar} style={styles.finishImage} contentFit="contain" />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 34 }]}>
        <PreferencePrimaryButton
          label="홈으로 돌아가기"
          onPress={() => router.replace('/(tabs)' as never)}
        />
      </View>
    </View>
  )
}

export function PreferenceResultScreen() {
  const params = useLocalSearchParams<{ stage?: string | string[] }>()
  const [tab, setTab] = useState<Tab>('like')
  const stage = parseStage(params.stage)

  if (stage === 'list') {
    return <PreferenceListStage tab={tab} onTabChange={setTab} />
  }

  if (stage === 'finish') {
    return <PreferenceFinishStage />
  }

  return <PreferenceCompleteStage />
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  footer: {
    paddingHorizontal: 16,
  },
  completeContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  completeCopy: {
    marginTop: 96,
    alignItems: 'center',
  },
  completeTitle: {
    ...Typography.heading1,
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'SUIT',
  },
  completeBody: {
    marginTop: 4,
    ...Typography.body1Medium,
    color: Gray[500],
    textAlign: 'center',
    fontFamily: 'SUIT',
  },
  completeImage: {
    width: '100%',
    flex: 1,
  },
  finishContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  finishCopy: {
    marginTop: 96,
    alignItems: 'center',
  },
  finishTitle: {
    ...Typography.heading1,
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'SUIT',
  },
  finishBody: {
    marginTop: 4,
    ...Typography.body1Medium,
    color: Gray[500],
    textAlign: 'center',
    fontFamily: 'SUIT',
  },
  finishImage: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginTop: 72,
    marginBottom: 184,
  },
  listHeader: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  listHeaderTitle: {
    ...Typography.body1Medium,
    color: '#000000',
    fontFamily: 'SUIT',
  },
  completeLabel: {
    ...Typography.body1Medium,
    color: Magenta[300],
    fontFamily: 'SUIT',
  },
  tabsWrap: {
    position: 'relative',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Gray[200],
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabLabel: {
    ...Typography.body1Medium,
    fontFamily: 'SUIT',
  },
  tabActive: {
    color: Gray[900],
  },
  tabInactive: {
    color: Gray[400],
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '50%',
    backgroundColor: '#000000',
  },
  tabUnderlineLeft: {
    left: '0%',
  },
  tabUnderlineRight: {
    left: '50%',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 0,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
    backgroundColor: C.card,
  },
  thumbnailWrap: {
    width: 62,
    height: 84,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  thumbnail: {
    width: 62,
    height: 84,
  },
  thumbnailFallback: {
    flex: 1,
    backgroundColor: Gray[200],
  },
  listCopy: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    ...Typography.body1Semibold,
    color: '#000000',
    fontFamily: 'SUIT',
  },
  listMeta: {
    marginTop: 4,
    ...Typography.body2Medium,
    color: Gray[500],
    fontFamily: 'SUIT',
  },
  ratingText: {
    marginTop: 4,
    ...Typography.caption1Medium,
    color: Magenta[300],
    fontFamily: 'SUIT',
  },
  favoriteButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
  },
  loadingListWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
})
