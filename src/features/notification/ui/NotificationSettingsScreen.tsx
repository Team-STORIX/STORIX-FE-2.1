import { useCallback, useEffect, useRef, useState } from 'react'
import { Image } from 'expo-image'
import {
  ActivityIndicator,
  Linking,
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
  usePushPermissionStatus,
  useUpdateEventBenefitConsent,
  useUpdateNotificationSettings,
} from '../hooks'
import type {
  MarketingConsentResult,
  NotificationSettings,
} from '../api/notification.schema'
import { NotificationConsentModal } from './NotificationConsentModal'
import { NotificationHeader } from './NotificationHeader'
import { NotificationPermissionGuideModal } from './NotificationPermissionGuideModal'

const activeIcon = require('../../../../assets/icons/common/active.svg')
const deactiveIcon = require('../../../../assets/icons/common/deactive.svg')
const chevronIcon = require('../../../../assets/icons/common/icon-arrow-forward.svg')

type ToggleKey = keyof NotificationSettings

const TOGGLE_ROWS: { key: ToggleKey; label: string; description: string }[] = [
  {
    key: 'myActivityEnabled',
    label: '내 활동 알림',
    description: '내 피드, 댓글, 리뷰에 대한 반응 알림을 받습니다.',
  },
  {
    key: 'contentCommunityEnabled',
    label: '콘텐츠·커뮤니티 알림',
    description: '오늘의 피드 선정, 참여 토픽룸의 HOT 선정 알림을 받습니다.',
  },
  {
    key: 'eventBenefitEnabled',
    label: '이벤트 및 혜택 알림',
    description: '이벤트, 혜택, 프로모션 알림을 받습니다.',
  },
  {
    key: 'operationPolicyEnabled',
    label: '운영·정책 알림',
    description: '신고 처리, 이용 제한, 약관 변경 안내를 받습니다.',
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
  const { granted: pushGranted, lastChange: pushPermissionChange } =
    usePushPermissionStatus()

  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [notificationResult, setNotificationResult] = useState<{
    enabled: boolean
    result: MarketingConsentResult | null
  } | null>(null)
  const awaitingOsPermissionChangeRef = useRef(false)

  const isPending = updateSettings.isPending || updateEventBenefit.isPending
  const pushReceiptEnabled = pushGranted === true
  const detailTogglesDisabled = pushGranted !== true || isPending

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/notifications' as never)
  }, [router])

  const openOsSettings = useCallback(() => {
    // Never crash if the platform can't open settings (e.g. unsupported).
    void Linking.openSettings().catch((err) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[notification-settings] openSettings failed', err)
      }
    })
  }, [])

  // "알림 수신" always shows the guide modal first, regardless of the current
  // OS permission. Device settings open only after the user taps "확인" — the
  // row press itself never calls Linking.openSettings() and never prompts.
  const handlePushReceiptPress = useCallback(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NOTIFICATION_SETTINGS_DEBUG] push receipt row pressed', {
        pushGranted,
      })
    }
    setPermissionModalOpen(true)
  }, [pushGranted])

  const handleConfirmPermission = useCallback(() => {
    setPermissionModalOpen(false)
    awaitingOsPermissionChangeRef.current = true
    openOsSettings()
  }, [openOsSettings])

  useEffect(() => {
    if (!awaitingOsPermissionChangeRef.current || !pushPermissionChange) return

    awaitingOsPermissionChangeRef.current = false
    setNotificationResult({
      enabled: pushPermissionChange.granted,
      // Use the same fallback copy as the first Home consent result modal.
      result: null,
    })
  }, [pushPermissionChange])

  const handleToggle = useCallback(
    (key: ToggleKey) => {
      if (!settings || detailTogglesDisabled) return
      const next = !settings[key]

      if (isMarketingConsent(key)) {
        updateEventBenefit.mutate(next, {
          onSuccess: (result, enabled) => {
            setNotificationResult({ enabled, result })
          },
        })
        return
      }

      // Send ONLY the changed field, e.g. { myActivityEnabled: next }.
      updateSettings.mutate({ [key]: next })
    },
    [settings, detailTogglesDisabled, updateSettings, updateEventBenefit],
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
          {/* 알림 수신 — OS permission plus the app's notification preferences. */}
          <Pressable
            onPress={handlePushReceiptPress}
            accessibilityRole="button"
            accessibilityLabel="알림 수신 설정"
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>알림 수신</Text>
              <Text style={styles.rowDesc}>
                스토릭스 앱에서 보내는 push 알림 메시지를 받습니다.{'\n'}
                내 활동 관련 알림, 운영·정책 알림 등의 기본 알림 포함
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.statusText}>
                {pushGranted === null ? '' : pushReceiptEnabled ? 'ON' : 'OFF'}
              </Text>
              <Image
                source={chevronIcon}
                style={styles.chevron}
                contentFit="contain"
              />
            </View>
          </Pressable>

          {/* Toggle rows bound to notification-settings fields. */}
          {TOGGLE_ROWS.map((row) => {
            const enabled = pushGranted === true && settings[row.key]
            return (
              <View
                key={row.key}
                style={[
                  styles.row,
                  detailTogglesDisabled && styles.disabledRow,
                ]}
              >
                <View style={styles.rowText}>
                  <Text
                    style={[
                      styles.rowLabel,
                      detailTogglesDisabled && styles.disabledLabel,
                    ]}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={[
                      styles.rowDesc,
                      detailTogglesDisabled && styles.disabledDesc,
                    ]}
                  >
                    {row.description}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleToggle(row.key)}
                  disabled={detailTogglesDisabled}
                  accessibilityRole="switch"
                  accessibilityState={{
                    checked: enabled,
                    disabled: detailTogglesDisabled,
                  }}
                  accessibilityLabel={`${row.label} 토글`}
                  hitSlop={6}
                  style={detailTogglesDisabled && styles.disabledToggle}
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

      <NotificationPermissionGuideModal
        visible={permissionModalOpen}
        message={'기기 설정에서 알림을 켜 주세요\n설정 화면에서 STORIX 알림을 허용해 주세요.'}
        onCancel={() => setPermissionModalOpen(false)}
        onConfirm={handleConfirmPermission}
      />

      <NotificationConsentModal
        step={
          notificationResult == null
            ? 'hidden'
            : notificationResult.enabled
              ? 'agreeResult'
              : 'rejectResult'
        }
        submitting={false}
        result={notificationResult?.result ?? null}
        onAgree={() => {}}
        onReject={() => {}}
        onConfirm={() => setNotificationResult(null)}
      />
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
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: 16,
  },
  rowPressed: {
    opacity: 0.7,
  },
  disabledRow: {
    backgroundColor: C.bg,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  rowLabel: {
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22.4,
    color: C.text,
  },
  disabledLabel: {
    color: Gray[400],
  },
  rowDesc: {
    fontFamily: 'SUIT',
    fontSize: 10.898,
    fontWeight: '500',
    color: Gray[500],
  },
  disabledDesc: {
    color: Gray[400],
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  statusText: {
    fontFamily: 'SUIT',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: C.primary,
    textAlign: 'center',
  },
  chevron: {
    width: 16,
    height: 16,
  },
  toggleIcon: {
    width: 42.33,
    height: 23.089,
  },
  disabledToggle: {
    opacity: 0.5,
  },
})
