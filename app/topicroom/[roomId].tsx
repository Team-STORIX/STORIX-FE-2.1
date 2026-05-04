import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useProfileStore } from '../../src/features/profile'
import {
  ChatBubble,
  ChatInput,
  ConnectionStatusPill,
  useChatRoomMessagesInfinite,
  useLeaveTopicRoom,
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

  const myUserId = useProfileStore((s) => s.me?.userId)
  const router = useRouter()
  const [inputText, setInputText] = useState('')

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
  const memberCount = membersQuery.data?.length ?? 0
  const leaveMutation = useLeaveTopicRoom()

  const handleLeave = useCallback(() => {
    Alert.alert(
      '채팅방 나가기',
      '정말 이 채팅방을 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: () =>
            leaveMutation.mutate(roomId, {
              onSuccess: () => router.back(),
            }),
        },
      ],
    )
  }, [leaveMutation, roomId, router])

  const historyDisplay: DisplayMsg[] = useMemo(() => {
    if (!historyData?.pages) return []
    return historyData.pages.flatMap((page) =>
      page.content.map((m) => ({
        key: `h_${m.id}`,
        text: m.message,
        senderName: m.senderName,
        time: formatTime(m.createdAt),
        isMe: m.senderId === myUserId,
      })),
    )
  }, [historyData, myUserId])

  const realtimeDisplay: DisplayMsg[] = useMemo(
    () =>
      realtimeMsgs.map((m) => ({
        key: `rt_${m.id}`,
        text: m.text,
        senderName: m.userName ?? '',
        time: m.time,
        isMe: m.type === 'me',
      })),
    [realtimeMsgs],
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

  const headerTitle =
    memberCount > 0 ? `채팅방 #${roomId} · ${memberCount}명` : `채팅방 #${roomId}`

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />

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
        renderItem={({ item }) => <ChatBubble msg={item} />}
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                아직 메시지가 없습니다. 첫 메시지를 보내보세요.
              </Text>
            </View>
          ) : null
        }
      />

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        canSend={canSend}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  leaveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  leaveBtnPressed: { opacity: 0.6 },
  leaveBtnText: { fontSize: 14, color: C.error, fontWeight: '600' },

  centeredLoader: { flex: 1, alignSelf: 'center', marginTop: 40 },
  errorText: {
    color: C.error,
    textAlign: 'center',
    padding: 16,
    fontSize: 13,
  },

  listContent: { paddingVertical: 8 },

  paginationLoader: { paddingVertical: 10 },

  emptyContainer: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
})
