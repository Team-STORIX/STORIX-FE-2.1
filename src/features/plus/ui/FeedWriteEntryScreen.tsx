import { StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Radius, S, Typography } from '../../../theme'
import { useWorksDetail } from '../../works'
import { WriteTargetWorkCard } from './WriteTargetWorkCard'

function parseWorksId(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

export function FeedWriteEntryScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ worksId?: string }>()
  const worksId = parseWorksId(params.worksId)
  const worksQuery = useWorksDetail(worksId ?? 0)
  const work = worksQuery.data

  const workMeta = [work?.author, work?.worksType, work?.genre]
    .filter(Boolean)
    .join(' · ')

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 18 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <Text style={styles.title}>피드 작성</Text>

        {worksId ? (
          <WriteTargetWorkCard
            title={work?.worksName ?? '선택한 작품'}
            meta={workMeta}
            thumbnailUrl={work?.thumbnailUrl ?? undefined}
            loading={worksQuery.isLoading}
          />
        ) : (
          <View style={styles.emptyTargetCard}>
            <Text style={styles.emptyTargetTitle}>작품 선택은 다음 단계에서 연결됩니다.</Text>
            <Text style={styles.emptyTargetBody}>
              현재는 2.0 진입 구조를 맞추기 위한 엔트리 화면만 연결되어 있어요.
            </Text>
          </View>
        )}

        <View style={styles.todoCard}>
          <Text style={styles.todoTitle}>피드 작성 화면 준비 중</Text>
          <Text style={styles.todoBody}>
            전체 텍스트 작성, 스포일러 설정, 이미지 업로드는 다음 단계에서 구현합니다.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: S.screenH,
    gap: 16,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  emptyTargetCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 6,
  },
  emptyTargetTitle: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  emptyTargetBody: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
  todoCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 6,
  },
  todoTitle: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  todoBody: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
})
