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
  useUpdateNotificationSettings,
} from '../hooks'
import type {
  NotificationSettings,
  UpdateNotificationSettingsPayload,
} from '../api/notification.schema'
import { NotificationHeader } from './NotificationHeader'

const activeIcon = require('../../../../assets/icons/common/active.svg')
const deactiveIcon = require('../../../../assets/icons/common/deactive.svg')

// TODO(NOTIFICATION-CONSENT-UI): the marketing-consent modal flow
// (useUpdateMarketingConsent) is intentionally NOT wired here — implement it in
// the dedicated consent-UI phase.

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

// eventBenefitEnabled is server-controlled and excluded from the PATCH body.
const isReadOnly = (key: ToggleKey) => key === 'eventBenefitEnabled'

export function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { data: settings, isLoading, isError } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/notifications' as never)
  }, [router])

  const handleToggle = useCallback(
    (key: ToggleKey) => {
      if (!settings || isReadOnly(key) || updateSettings.isPending) return
      // PATCH excludes eventBenefitEnabled per the API contract.
      const payload: UpdateNotificationSettingsPayload = {
        myActivityEnabled: settings.myActivityEnabled,
        contentCommunityEnabled: settings.contentCommunityEnabled,
        operationPolicyEnabled: settings.operationPolicyEnabled,
        [key]: !settings[key],
      }
      updateSettings.mutate(payload)
    },
    [settings, updateSettings],
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
          <Text style={styles.errorText}>알림 설정을 불러오지 못했어요.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {ROWS.map((row) => {
            const enabled = settings[row.key]
            const readOnly = isReadOnly(row.key)
            return (
              <View key={row.key} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowDesc}>{row.description}</Text>
                </View>
                <Pressable
                  onPress={() => handleToggle(row.key)}
                  disabled={readOnly}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: enabled, disabled: readOnly }}
                  accessibilityLabel={`${row.label} 토글`}
                  hitSlop={6}
                  style={readOnly && styles.readOnly}
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
  readOnly: {
    opacity: 0.4,
  },
})
