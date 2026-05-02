import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useWorksDetail } from '../../src/hooks/works/useWorksDetail'
import { useFavoriteWork } from '../../src/hooks/favorite/useFavoriteWork'
import { useJoinTopicRoom } from '../../src/hooks/topicroom/useJoinTopicRoom'
import { findTopicRoomIdByWorksName } from '../../src/lib/api/topicroom/topicroom.api'

// TODO(Phase works-ui): Replace with the final works detail design.

type EntryPhase = 'idle' | 'searching' | 'joining' | 'error'

export default function WorksDetailScreen() {
  const { worksId: worksIdParam } = useLocalSearchParams<{ worksId: string }>()
  const worksId = typeof worksIdParam === 'string' ? Number(worksIdParam) : 0

  const router = useRouter()

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    data: works,
    isLoading: worksLoading,
    isError: worksError,
  } = useWorksDetail(worksId)

  const { isFavorite, isMutating, toggleFavorite, isLoading: favLoading } =
    useFavoriteWork(worksId)

  const joinMutation = useJoinTopicRoom()

  // ── TopicRoom entry state ─────────────────────────────────────────────
  const [entryPhase, setEntryPhase] = useState<EntryPhase>('idle')
  const [entryError, setEntryError] = useState<string | null>(null)

  const enterTopicRoom = useCallback(async () => {
    if (!works?.worksName) return
    setEntryPhase('searching')
    setEntryError(null)

    try {
      // Step 1: find a topicroom that matches this works title exactly.
      const roomId = await findTopicRoomIdByWorksName(works.worksName)

      if (!roomId) {
        setEntryPhase('error')
        setEntryError('이 작품의 토픽룸이 없습니다.')
        return
      }

      // Step 2: join (409 = already a member, handled as success by the hook).
      setEntryPhase('joining')
      await joinMutation.mutateAsync(roomId)

      // Step 3: navigate to chat.
      router.push(`/topicroom/${roomId}`)
      setEntryPhase('idle')
    } catch {
      setEntryPhase('error')
      setEntryError('토픽룸 입장에 실패했습니다. 다시 시도해주세요.')
    }
  }, [works?.worksName, joinMutation, router])

  const isEntering = entryPhase === 'searching' || entryPhase === 'joining'

  // ── Loading / error states ────────────────────────────────────────────
  if (worksLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '작품 상세' }} />
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (worksError || !works) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '작품 상세' }} />
        <Text style={styles.errorText}>작품 정보를 불러오지 못했습니다.</Text>
      </View>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: works.worksName,
          headerBackTitle: '뒤로',
        }}
      />

      {/* Thumbnail */}
      {works.thumbnailUrl ? (
        <Image
          source={{ uri: works.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailPlaceholderText}>이미지 없음</Text>
        </View>
      )}

      {/* Title + metadata */}
      <View style={styles.meta}>
        <Text style={styles.title}>{works.worksName}</Text>

        <View style={styles.tags}>
          {works.worksType ? (
            <Tag label={works.worksType} />
          ) : null}
          {works.genre ? (
            <Tag label={works.genre} />
          ) : null}
        </View>

        {works.author ? (
          <Text style={styles.author}>{works.author}</Text>
        ) : null}

        {works.avgRating != null ? (
          <Text style={styles.rating}>⭐ {works.avgRating.toFixed(1)}</Text>
        ) : null}
      </View>

      {/* Description */}
      {works.description ? (
        <View style={styles.descSection}>
          <Text style={styles.sectionLabel}>작품 소개</Text>
          <Text style={styles.description}>{works.description}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Favorite toggle */}
        <Pressable
          style={[styles.actionBtn, styles.favoriteBtn]}
          onPress={() => toggleFavorite()}
          disabled={favLoading || isMutating}
        >
          {favLoading || isMutating ? (
            <ActivityIndicator color="#333" size="small" />
          ) : (
            <Text style={styles.favoriteBtnText}>
              {isFavorite ? '♥ 즐겨찾기 해제' : '♡ 즐겨찾기 추가'}
            </Text>
          )}
        </Pressable>

        {/* TopicRoom entry */}
        <Pressable
          style={[styles.actionBtn, styles.topicRoomBtn, isEntering && styles.btnDisabled]}
          onPress={enterTopicRoom}
          disabled={isEntering}
        >
          {isEntering ? (
            <View style={styles.entryLoading}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.topicRoomBtnText}>
                {entryPhase === 'searching' ? '토픽룸 검색 중…' : '입장 중…'}
              </Text>
            </View>
          ) : (
            <Text style={styles.topicRoomBtnText}>💬 토픽룸 입장</Text>
          )}
        </Pressable>
      </View>

      {/* Entry error */}
      {entryPhase === 'error' && entryError && (
        <View style={styles.entryErrorBox}>
          <Text style={styles.entryErrorText}>{entryError}</Text>
          <Pressable onPress={() => setEntryPhase('idle')}>
            <Text style={styles.entryErrorDismiss}>닫기</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#c00', fontSize: 14 },

  thumbnail: { width: '100%', height: 220, backgroundColor: '#f0f0f0' },
  thumbnailPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  thumbnailPlaceholderText: { color: '#bbb', fontSize: 13 },

  meta: { padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: '#555' },
  author: { fontSize: 13, color: '#777', marginBottom: 4 },
  rating: { fontSize: 13, color: '#555' },

  descSection: { padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8 },
  description: { fontSize: 14, color: '#333', lineHeight: 22 },

  actions: { padding: 20, gap: 12 },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtn: {
    borderWidth: 1.5,
    borderColor: '#222',
    backgroundColor: '#fff',
  },
  favoriteBtnText: { fontSize: 15, fontWeight: '600', color: '#222' },
  topicRoomBtn: { backgroundColor: '#222' },
  topicRoomBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  entryLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  entryErrorBox: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryErrorText: { fontSize: 13, color: '#c00', flex: 1 },
  entryErrorDismiss: { fontSize: 13, color: '#888', marginLeft: 12 },
})
