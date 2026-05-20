import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Toast } from '../../src/components/common/Toast'
import { WarningEmptyState } from '../../src/components/common/WarningEmptyState'
import { useProfileStore } from '../../src/features/profile'
import {
  ChatBubble,
  ChatInput,
  ConnectionStatusPill,
  TopicRoomMenuSheet,
  TopicRoomReportSheet,
  TopicRoomTopBar,
  useChatRoomMessagesInfinite,
  useLeaveTopicRoom,
  useReportTopicRoomUser,
  useTopicRoomMembers,
  useTopicRoomStomp,
  type DisplayMsg,
} from '../../src/features/topicroom'
import { C } from '../../src/theme/colors'

const formatTime = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

export default function TopicRoomScreen() {
  const { roomId: roomIdParam } = useLocalSearchParams<{ roomId: string }>()
  const roomId = typeof roomIdParam === 'string' ? Number(roomIdParam) : 0

  const insets = useSafeAreaInsets()
  const myUserId = useProfileStore((s) => s.me?.userId)
  const router = useRouter()
  const [inputText, setInputText] = useState('')

  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [presetReportUserId, setPresetReportUserId] = useState<number | null>(null)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 2400)
  }, [])

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    },
    [],
  )

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatRoomMessagesInfinite({ roomId })

  const { status, messages: realtimeMsgs, sendMessage } = useTopicRoomStomp({ roomId })
  const membersQuery = useTopicRoomMembers(roomId)
  const members = membersQuery.data ?? []
  const memberCount = members.length
  const leaveMutation = useLeaveTopicRoom()
  const reportMutation = useReportTopicRoomUser()

  const memberAvatarById = useMemo(() => {
    const map = new Map<number, string | null>()
    for (const m of members) map.set(m.userId, m.profileImageUrl ?? null)
    return map
  }, [members])

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)' as const)
  }, [router])

  const handleLeave = useCallback(() => {
    if (leaveMutation.isPending) return
    Alert.alert('채팅방 나가기', '정말 이 채팅방을 나가시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: () => {
          leaveMutation.mutate(roomId, {
            onSuccess: () => {
              if (router.canGoBack()) router.back()
              else router.replace('/(tabs)' as const)
            },
            onError: () => {
              showToast('채팅방을 나가지 못했어요. 잠시 후 다시 시도해 주세요.')
            },
          })
        },
      },
    ])
  }, [leaveMutation, roomId, router, showToast])

  const handleConfirmReport = useCallback(
    async (params: { userId: number; reason: string }) => {
      if (reportMutation.isPending) return
      try {
        await reportMutation.mutateAsync({
          roomId,
          reportedUserId: params.userId,
          reason: params.reason,
        })
        setReportOpen(false)
        setPresetReportUserId(null)
        showToast('신고가 접수되었어요.')
      } catch {
        showToast('신고 접수에 실패했어요. 잠시 후 다시 시도해 주세요.')
      }
    },
    [reportMutation, roomId, showToast],
  )

  const historyDisplay: DisplayMsg[] = useMemo(() => {
    if (!historyData?.pages) return []
    return historyData.pages.flatMap((page) =>
      page.content.map((m) => ({
        key: `h_${m.id}`,
        text: m.message,
        senderId: m.senderId,
        senderName: m.senderName,
        profileImageUrl: memberAvatarById.get(m.senderId) ?? null,
        time: formatTime(m.createdAt),
        isMe: m.senderId === myUserId,
      })),
    )
  }, [historyData, memberAvatarById, myUserId])

  const realtimeDisplay: DisplayMsg[] = useMemo(
    () =>
      realtimeMsgs.map((m) => ({
        key: `rt_${m.id}`,
        text: m.text,
        senderId: m.senderId,
        senderName: m.userName ?? '',
        profileImageUrl:
          typeof m.senderId === 'number' ? memberAvatarById.get(m.senderId) ?? null : null,
        time: m.time,
        isMe: m.type === 'me',
      })),
    [memberAvatarById, realtimeMsgs],
  )

  const allMessages: DisplayMsg[] = useMemo(
    () => [...realtimeDisplay.slice().reverse(), ...historyDisplay],
    [realtimeDisplay, historyDisplay],
  )

  const handleSend = useCallback(() => {
    const sent = sendMessage(inputText.trim())
    if (sent) setInputText('')
  }, [sendMessage, inputText])

  const canSend = status === 'open' && !!inputText.trim()

  const headerTitle = `채팅방 #${roomId}`

  const onLongPressOther = useCallback(
    (msg: DisplayMsg) => {
      if (typeof msg.senderId !== 'number') return
      if (msg.senderId === myUserId) return
      setPresetReportUserId(msg.senderId)
      setReportOpen(true)
    },
    [myUserId],
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <TopicRoomTopBar
        topInset={insets.top}
        title={headerTitle}
        memberCount={memberCount > 0 ? memberCount : undefined}
        onBack={handleBack}
        onPressMenu={() => setMenuOpen(true)}
      />

      <ConnectionStatusPill status={status} />

      {historyLoading && !historyData ? (
        <ActivityIndicator style={styles.centeredLoader} size="large" color={C.primary} />
      ) : null}

      {!historyLoading && historyError ? (
        <Text style={styles.errorText}>메시지 기록을 불러오지 못했습니다.</Text>
      ) : null}

      <FlatList
        inverted
        data={allMessages}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ChatBubble msg={item} onLongPressOther={onLongPressOther} />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.paginationLoader} size="small" color={C.primary} />
          ) : null
        }
        ListEmptyComponent={
          !historyLoading && !historyError ? (
            <WarningEmptyState
              description="아직 메시지가 없습니다. 첫 메시지를 보내보세요."
              iconSize={96}
              style={styles.chatEmpty}
            />
          ) : null
        }
      />

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        canSend={canSend}
      />

      <TopicRoomMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onPressReport={() => {
          setPresetReportUserId(null)
          setReportOpen(true)
        }}
        onPressLeave={handleLeave}
        leaveDisabled={leaveMutation.isPending}
      />

      <TopicRoomReportSheet
        visible={reportOpen}
        members={members}
        myUserId={myUserId ?? null}
        isSubmitting={reportMutation.isPending}
        onClose={() => {
          if (reportMutation.isPending) return
          setReportOpen(false)
          setPresetReportUserId(null)
        }}
        onConfirm={handleConfirmReport}
        key={presetReportUserId ?? 'report'}
      />

      <Toast message={toastMessage} bottomOffset={insets.bottom + 80} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  centeredLoader: { flex: 1, alignSelf: 'center', marginTop: 40 },
  errorText: {
    color: C.error,
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
  },

  listContent: { paddingVertical: 12 },

  paginationLoader: { paddingVertical: 10 },

  chatEmpty: {
    paddingVertical: 56,
    transform: [{ scaleY: -1 }],
  },
})
