import { useCallback } from 'react'
import { Image } from 'expo-image'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { C, Gray } from '../../../theme'
import {
  useNotificationSettings,
  useUpdateEventBenefitConsent,
  useUpdateNotificationSettings,
} from '../hooks'
import type { NotificationSettings } from '../api/notification.schema'
import { NotificationHeader } from './NotificationHeader'

const activeIcon = require('../../../../assets/icons/common/active.svg')
const deactiveIcon = require('../../../../assets/icons/common/deactive.svg')

type ToggleKey = keyof NotificationSettings

const ROWS: { key: ToggleKey; label: string; description: string }[] = [
  {
    key: 'myActivityEnabled',
    label: '내 활동 알림',
    description: '내 피드/리뷰에 대한 좋아요, 댓글 알림',
  },
  {
    key: 'contentCommunityEnabled',
    label: '콘텐츠/커뮤니티 알림',
    description: '토픽룸 및 추천 콘텐츠 소식',
  },
  {
    key: 'eventBenefitEnabled',
    label: '이벤트/혜택 알림',
    description: '이벤트 및 마케팅 정보 (별도 동의 필요)',
  },
  {
    key: 'operationPolicyEnabled',
    label: '운영/정책 알림',
    description: '약관 및 정책 업데이트, 운영 안내',
  },
]

// eventBenefitEnabled is not part of the settings PATCH — it is driven by the
// marketing-consent endpoint (see useUpdateEventBenefitConsent).
const isMarketingConsent = (key: ToggleKey) => key === 'eventBenefitEnabled'

export function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { data: settings, isLoading, isError } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()
  const updateEventBenefit = useUpdateEventBenefitConsent()

  const isPending = updateSettings.isPending || updateEventBenefit.isPending

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/notifications' as never)
  }, [router])

  const handleToggle = useCallback(
    (key: ToggleKey) => {
      if (!settings || isPending) return
      const next = !settings[key]

      if (isMarketingConsent(key)) {
        // PATCH /settings rejects eventBenefitEnabled, so the event/benefit
        // preference goes through PUT /notifications/marketing-consent instead.
        // No result modal and no first-home consent storage is touched here.
        updateEventBenefit.mutate(next)
        return
      }

      // Send ONLY the changed field, e.g. { myActivityEnabled: next }.
      updateSettings.mutate({ [key]: next })
    },
    [settings, isPending, updateSettings, updateEventBenefit],
  )

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <NotificationHeader title="알림 설정" onBack={goBack} />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : isError || !settings ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>알림 설정을 불러올 수 없어요.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {ROWS.map((row) => {
            const enabled = settings[row.key]
            return (
              <View key={row.key} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowDesc}>{row.description}</Text>
                </View>
                <Pressable
                  onPress={() => handleToggle(row.key)}
                  disabled={isPending}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: enabled, disabled: isPending }}
                  accessibilityLabel={`${row.label} 토글`}
                  hitSlop={6}
                  style={isPending && styles.pendingToggle}
                >
                  <Image
                    source={enabled ? activeIcon : deactiveIcon}
                    style={styles.toggleIcon}
                    contentFit="contain"
                  />
                </Pressable>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textMuted,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: 16,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: Gray[900],
  },
  rowDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: Gray[500],
  },
  toggleIcon: {
    width: 32,
    height: 18,
  },
  pendingToggle: {
    opacity: 0.5,
  },
})
