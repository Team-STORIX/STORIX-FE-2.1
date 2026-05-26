import { useCallback, useState } from 'react'
import { Image } from 'expo-image'
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { C } from '../../../theme'
import {
  useNotificationSettings,
  usePushPermissionStatus,
  useUpdateEventBenefitConsent,
  useUpdateNotificationSettings,
} from '../hooks'
import type { NotificationSettings } from '../api/notification.schema'
import { NotificationHeader } from './NotificationHeader'

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
  const { granted: pushGranted } = usePushPermissionStatus()

  const [permissionModalOpen, setPermissionModalOpen] = useState(false)

  const isPending = updateSettings.isPending || updateEventBenefit.isPending

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
    openOsSettings()
  }, [openOsSettings])

  const handleToggle = useCallback(
    (key: ToggleKey) => {
      if (!settings || isPending) return
      const next = !settings[key]

      if (isMarketingConsent(key)) {
        // PATCH /settings rejects eventBenefitEnabled, so the event/benefit
        // preference goes through PUT /notifications/marketing-consent. No
        // first-home result modal and no consent-completed storage is touched.
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
          {/* 알림 수신 — reflects OS push permission, not a settings field. */}
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
                {pushGranted === null ? '' : pushGranted ? 'ON' : 'OFF'}
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

      {/* OS-permission-OFF modal (Figma 8489:29739). */}
      <Modal
        visible={permissionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPermissionModalOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>알림 설정</Text>
            <Text style={styles.modalBody}>
              기기 설정에서 알림을 켜 주세요{'\n'}
              설정 화면에서 STORIX 알림을 허용해 주세요.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setPermissionModalOpen(false)}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelLabel}>취소</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmPermission}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.confirmLabel}>확인</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f2edef',
    gap: 16,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22.4,
    color: '#131112',
  },
  rowDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15.4,
    color: '#847b7f',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },
  chevron: {
    width: 16,
    height: 16,
  },
  toggleIcon: {
    width: 32,
    height: 18,
  },
  pendingToggle: {
    opacity: 0.5,
  },
  // ----- permission modal -----
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 306,
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  modalTitle: {
    paddingHorizontal: 24,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#131112',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalBody: {
    paddingHorizontal: 24,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: '#847B7F',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  modalButtons: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3DCDF',
    backgroundColor: '#F9F6F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#484245',
  },
  confirmButton: {
    flex: 1,
    height: 49,
    borderRadius: 8,
    backgroundColor: '#131112',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#FFF',
  },
  pressed: {
    opacity: 0.7,
  },
})
