import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useChatRoomMessagesInfinite } from '../../src/hooks/topicroom/useChatRoomMessagesInfinite'
import { useTopicRoomStomp } from '../../src/hooks/topicroom/useTopicRoomStomp'
import { useProfileStore } from '../../src/store/profile.store'

// TODO(Phase chat-ui): Replace with the final chat UI design.

// ─── Unified display type ─────────────────────────────────────────────────────
// Normalises ChatRoomMessage (history, REST) and TopicRoomUiMsg (realtime, STOMP)
// into one shape so a single renderItem handles both sources.

type DisplayMsg = {
  key: string
  text: string
  senderName: string
  time: string
  isMe: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const STATUS_COLOR: Record<string, string> = {
  idle: '#999',
  connecting: '#f90',
  open: '#2a2',
  closed: '#999',
  error: '#c00',
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TopicRoomScreen() {
  const { roomId: roomIdParam } = useLocalSearchParams<{ roomId: string }>()
  // roomId is always a string from the dynamic route segment.
  const roomId = typeof roomIdParam === 'string' ? Number(roomIdParam) : 0

  const myUserId = useProfileStore((s) => s.me?.userId)
  const [inputText, setInputText] = useState('')

  // ── History (REST, paginated, createdAt DESC) ────────────────────────────
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatRoomMessagesInfinite({ roomId })

  // ── Realtime (STOMP WebSocket) ──────────────────────────────────────────
  const { status, messages: realtimeMsgs, sendMessage } = useTopicRoomStomp({ roomId })

  // ── Normalise history pages → DisplayMsg[] ──────────────────────────────
  // API returns newest first (createdAt DESC), page 0 = most recent.
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

  // ── Normalise STOMP messages → DisplayMsg[] ─────────────────────────────
  // STOMP hook appends messages oldest-first (index 0 = first message received).
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

  // ── Combined data for inverted FlatList ─────────────────────────────────
  // With inverted=true: data[0] appears at the visual BOTTOM.
  //   data[0]   = newest realtime  → visual bottom  (most recent message)
  //   data[n]   = oldest history   → visual top     (oldest message)
  //
  // Realtime messages are oldest-first in the array, so reverse them to put
  // newest at index 0. History is already newest-first (from DESC sort).
  const allMessages: DisplayMsg[] = useMemo(
    () => [...realtimeDisplay.slice().reverse(), ...historyDisplay],
    [realtimeDisplay, historyDisplay],
  )

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = () => {
    const sent = sendMessage(inputText.trim())
    if (sent) setInputText('')
  }

  const canSend = status === 'open' && !!inputText.trim()

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: `채팅방 #${roomId}`,
          headerBackTitle: '뒤로',
        }}
      />

      {/* STOMP connection status pill */}
      <View style={[styles.statusBar, { backgroundColor: STATUS_COLOR[status] ?? '#999' }]}>
        <Text style={styles.statusText}>● {status}</Text>
      </View>

      {/* Initial history load spinner */}
      {historyLoading && !historyData && (
        <ActivityIndicator style={styles.centeredLoader} size="large" />
      )}

      {/* History fetch error */}
      {historyError && (
        <Text style={styles.errorText}>메시지 기록을 불러오지 못했습니다.</Text>
      )}

      {/* Message list */}
      <FlatList
        inverted
        data={allMessages}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        // With inverted=true, onEndReached fires when the user scrolls to the
        // VISUAL TOP — which is when we need to load older (next) history pages.
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.4}
        // ListFooterComponent renders at the visual TOP in an inverted list —
        // correct placement for an "loading older messages" spinner.
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.paginationLoader} size="small" />
          ) : null
        }
      />

      {/* Input bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={status === 'open' ? '메시지를 입력하세요' : '연결 중…'}
          placeholderTextColor="#aaa"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={status === 'open'}
          blurOnSubmit={false}
        />
        <Pressable
          style={[styles.sendButton, !canSend && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Text style={styles.sendText}>전송</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: DisplayMsg }) {
  return (
    <View style={[styles.bubbleRow, msg.isMe ? styles.myRow : styles.otherRow]}>
      <View style={[styles.bubble, msg.isMe ? styles.myBubble : styles.otherBubble]}>
        {!msg.isMe && msg.senderName ? (
          <Text style={styles.senderName}>{msg.senderName}</Text>
        ) : null}
        <Text style={[styles.msgText, msg.isMe && styles.myMsgText]}>
          {msg.text}
        </Text>
        <Text style={[styles.timeText, msg.isMe && styles.myTimeText]}>
          {msg.time}
        </Text>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  statusBar: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    alignItems: 'flex-end',
  },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  centeredLoader: { flex: 1, alignSelf: 'center', marginTop: 40 },
  errorText: {
    color: '#c00',
    textAlign: 'center',
    padding: 16,
    fontSize: 13,
  },

  listContent: { paddingHorizontal: 12, paddingVertical: 8 },

  bubbleRow: { marginVertical: 3 },
  myRow: { alignItems: 'flex-end' },
  otherRow: { alignItems: 'flex-start' },

  bubble: {
    maxWidth: '75%',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  myBubble: { backgroundColor: '#222', borderBottomRightRadius: 3 },
  otherBubble: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 3 },

  senderName: { fontSize: 11, color: '#666', marginBottom: 3 },
  msgText: { fontSize: 15, color: '#111', lineHeight: 20 },
  myMsgText: { color: '#fff' },
  timeText: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
  myTimeText: { color: 'rgba(255,255,255,0.5)' },

  paginationLoader: { paddingVertical: 10 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#111',
  },
  sendButton: {
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { backgroundColor: '#bbb' },
  sendText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
