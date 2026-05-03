import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
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

export function ReviewWriteEntryScreen() {
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
        <Text style={styles.title}>리뷰 작성</Text>

        {!worksId ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>선택된 작품이 없어요.</Text>
            <Text style={styles.errorBody}>작품 선택 바텀시트에서 작품을 먼저 골라 주세요.</Text>
          </View>
        ) : worksQuery.isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : worksQuery.isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>작품 정보를 불러오지 못했어요.</Text>
            <Text style={styles.errorBody}>잠시 후 다시 시도해 주세요.</Text>
          </View>
        ) : (
          <WriteTargetWorkCard
            title={work?.worksName ?? '선택한 작품'}
            meta={workMeta}
            thumbnailUrl={work?.thumbnailUrl ?? undefined}
          />
        )}

        <View style={styles.todoCard}>
          <Text style={styles.todoTitle}>리뷰 작성 화면 준비 중</Text>
          <Text style={styles.todoBody}>
            선택한 작품 전달까지는 2.0 흐름과 동일하게 연결했고, 실제 리뷰 작성 폼은 다음 단계에서 구현합니다.
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
  loaderWrap: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 6,
  },
  errorTitle: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  errorBody: {
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
