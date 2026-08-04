import { isAxiosError } from 'axios'
import { Image } from 'expo-image'
import { Stack, router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useAttendanceEventStatus,
  useCheckInAttendanceEvent,
} from '../../../src/features/attendance-event'
import { Toast } from '../../../src/components/common/Toast'
import { C, FontFamily, Gray, Magenta, Typography } from '../../../src/theme'

const backIcon = require('../../../assets/icons/common/back.svg')
const stampOn = require('../../../assets/event/attendance/stamp-on.svg')
const stampOff = require('../../../assets/event/attendance/stamp-off.svg')
const attendanceTitle = require('../../../assets/event/attendance/attendance-title.png')
const giftCard = require('../../../assets/event/attendance/giftCard.png')

const MAX_STAMP_COUNT = 12

function getDateKey(value: string) {
  return value.slice(0, 10)
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Adds `days` to a yyyy-MM-dd key using UTC arithmetic. The server sends KST
// date strings; building a local Date and calling toISOString() would shift the
// day back by one on KST devices, so we keep everything in UTC and never let the
// device timezone touch the value.
function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function getStampDates(startAt: string, endAt: string) {
  const startKey = getDateKey(startAt)
  const endKey = getDateKey(endAt)

  if (!DATE_KEY_PATTERN.test(startKey) || !DATE_KEY_PATTERN.test(endKey)) {
    return Array.from({ length: MAX_STAMP_COUNT }, () => null)
  }

  const dates: Array<string | null> = []
  let cursor = startKey

  // yyyy-MM-dd compares lexicographically in chronological order.
  while (cursor <= endKey && dates.length < MAX_STAMP_COUNT) {
    dates.push(cursor)
    cursor = addDaysToDateKey(cursor, 1)
  }

  while (dates.length < MAX_STAMP_COUNT) {
    dates.push(null)
  }

  return dates
}

function getCheckInErrorMessage(status: number | undefined) {
  switch (status) {
    case 409:
      return '이미 오늘 출석했어요.'
    case 400:
      return '현재 참여할 수 없는 이벤트예요.'
    case 404:
      return '진행 중인 출석 이벤트가 없어요.'
    default:
      return '출석 처리에 실패했어요. 잠시 후 다시 시도해주세요.'
  }
}

export default function AttendanceEventScreen() {
  const insets = useSafeAreaInsets()
  const { data: status, isLoading: isStatusLoading } = useAttendanceEventStatus()
  const checkInMutation = useCheckInAttendanceEvent()

  const [toast, setToast] = useState<{
    message: string
    variant: 'default' | 'success'
  } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback(
    (message: string, variant: 'default' | 'success' = 'default') => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      setToast({ message, variant })
      toastTimer.current = setTimeout(() => setToast(null), 2000)
    },
    [],
  )

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  const stampDates = status
    ? getStampDates(status.eventStartDate, status.eventEndDate)
    : Array.from({ length: MAX_STAMP_COUNT }, () => null)
  const attendedDateKeys = new Set(status?.attendedDates.map(getDateKey))
  const stampStatus = stampDates.map((date) => date != null && attendedDateKeys.has(date))
  const isCheckInDisabled =
    isStatusLoading ||
    checkInMutation.isPending ||
    !status?.eventActive ||
    status.attendedToday
  const shouldDimCheckInButton = isStatusLoading || !status?.eventActive
  const isCheckInCompleted = checkInMutation.isPending || status?.attendedToday

  const handleCheckIn = () => {
    if (isCheckInDisabled) return
    checkInMutation.mutate(undefined, {
      onError: (error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined
        showToast(getCheckInErrorMessage(status))
      },
    })
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.header, { height: insets.top + 56, paddingTop: insets.top }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
          >
            <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>앱 런칭 기념 출석 이벤트</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
        >
          <View style={styles.attendanceSection}>
            <Image
              source={attendanceTitle}
              style={styles.sectionLabel}
              contentFit="contain"
              accessibilityLabel="출석 이벤트"
            />
            <View style={styles.stampBoard}>
              {stampStatus.map((isStamped, index) => (
                <Image
                  key={index}
                  source={isStamped ? stampOn : stampOff}
                  style={styles.stamp}
                  contentFit="contain"
                />
              ))}
            </View>
            <Pressable
              onPress={handleCheckIn}
              disabled={isCheckInDisabled}
              style={({ pressed }) => [
                styles.attendanceButton,
                isCheckInCompleted && styles.attendanceButtonCompleted,
                shouldDimCheckInButton && styles.attendanceButtonDisabled,
                pressed && !isCheckInDisabled && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isCheckInCompleted
                  ? '이미 출석체크를 완료했어요'
                  : '오늘치 출석 도장 찍기'
              }
            >
              <Text style={styles.attendanceButtonText}>
                {isCheckInCompleted
                  ? '이미 출석체크를 완료했어요'
                  : '오늘치 출석 도장 찍기'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.copyBlock}>
              <Text style={styles.title}>매일 STORIX에 출석하고{`\n`}웹툰·웹소설 캐시 받아가세요</Text>
              <Text style={styles.subtitle}>3일, 7일, 12일 출석할수록{`\n`}당첨 확률이 올라갑니다!</Text>
            </View>

            <View style={styles.rewardSection}>
              <Image source={giftCard} style={styles.giftCard} contentFit="contain" />
              <Text style={styles.rewardDescription}>
                총 <Text style={styles.rewardAccent}>5명을 추첨</Text>해{`\n`}
                카카오페이지 캐시 또는 리디 캐시 <Text style={styles.rewardAccent}>2만원권</Text> 지급
              </Text>
            </View>
          </View>

          <View style={styles.noticeSection}>
            <Text style={styles.noticeTitle}>*유의사항</Text>
            <Text style={styles.noticeText}>• 출석은 1일 1회만 가능합니다.</Text>
            <Text style={styles.noticeText}>• 응모권은 조건 달성 시 자동 지급됩니다.</Text>
            <Text style={styles.noticeText}>• 부정 참여가 확인될 경우 당첨이 취소될 수 있습니다.</Text>
            <Text style={styles.noticeText}>• 이벤트 종료 후 당첨자를 발표합니다.</Text>
            <Text style={styles.noticeText}>
              • 이벤트 기간은 2026년 8월 10일(월) ~ 8월 21일(금) 입니다.
            </Text>
            <Text style={styles.noticeText}>
              • 당첨 안내는 마케팅 알림 수신 동의자에 한하여 앱 푸시로 발송됩니다.
            </Text>
            <Text style={styles.noticeText}>
              • 마케팅 알림 수신에 동의하지 않았거나 이벤트 종료 전 수신을 해제한 경우, 당첨 안내를 받지 못할 수 있습니다.
            </Text>
          </View>
        </ScrollView>

        <Toast
          message={toast?.message}
          variant={toast?.variant}
          onClose={() => setToast(null)}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: C.card,
  },
  headerTitle: {
    ...Typography.body1Medium,
    color: C.text,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flexGrow: 1,
  },
  attendanceSection: {
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: Magenta[300],
  },
  sectionLabel: {
    width: 130,
    height: 24,
  },
  stampBoard: {
    width: 352,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#ff62a1',
  },
  stamp: {
    width: 72,
    height: 72,
  },
  attendanceButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Gray[900],
  },
  attendanceButtonDisabled: {
    opacity: 0.55,
  },
  attendanceButtonCompleted: {
    borderRadius: 12,
    backgroundColor: Magenta[200],
  },
  attendanceButtonText: {
    ...Typography.body2Bold,
    color: C.card,
  },
  detailSection: {
    gap: 24,
    paddingTop: 32,
    backgroundColor: C.card,
  },
  copyBlock: {
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    ...Typography.heading2,
    color: Gray[900],
    fontFamily: FontFamily.extrabold,
  },
  subtitle: {
    ...Typography.body2Bold,
    color: Gray[900],
  },
  rewardSection: {
    alignItems: 'center',
    minHeight: 240,
    paddingTop: 36,
  },
  giftCard: {
    width: 347,
    height: 104,
    maxWidth: '100%',
  },
  rewardDescription: {
    marginTop: 32,
    color: Gray[700],
    fontFamily: FontFamily.extrabold,
    fontSize: 14,
    lineHeight: 19.6,
    textAlign: 'center',
  },
  rewardAccent: {
    color: Magenta[300],
  },
  noticeSection: {
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: Gray[900],
  },
  noticeTitle: {
    ...Typography.caption1Extrabold,
    color: Gray[400],
  },
  noticeText: {
    ...Typography.caption1Medium,
    color: Gray[400],
  },
  pressed: {
    opacity: 0.7,
  },
})
