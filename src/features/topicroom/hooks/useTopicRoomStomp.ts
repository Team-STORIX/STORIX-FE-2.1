import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '../../../store/auth.store'
import { useProfileStore } from '../../profile/store/profile.store'
import {
  STORIX_STOMP_BROKER_URL,
  makeSubscriptionId,
  normalizeTopicRoomStompMessage,
  topicRoomPubPath,
  topicRoomSubPath,
} from '../stomp'
import type { TopicRoomUiMsg } from '../stomp'

// text-encoding polyfill for @stomp/stompjs is imported in app/_layout.tsx.
// @stomp/stompjs v7 uses native WebSocket via brokerURL — SockJS is not used.

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

export const useTopicRoomStomp = (params: { roomId: number }) => {
  const { roomId } = params
  const { accessToken } = useAuthStore()
  const myUserId = useProfileStore((s) => s.me?.userId ?? null)

  const clientRef = useRef<Client | null>(null)
  const subRef = useRef<StompSubscription | null>(null)
  const subIdRef = useRef<string | null>(null)

  // Prevents duplicate connect when roomId/token haven't changed (StrictMode / re-render).
  const sessionKeyRef = useRef<string>('')

  // Tracks optimistic messages sent by this client pending server echo.
  const pendingSentRef = useRef<Array<{ tempId: string; text: string; at: number }>>([])

  const [status, setStatus] = useState<Status>('idle')
  const [messages, setMessages] = useState<TopicRoomUiMsg[]>([])

  const canConnect = useMemo(() => !!roomId && !!accessToken, [roomId, accessToken])

  const unsubscribe = useCallback(() => {
    try {
      if (subRef.current) {
        subRef.current.unsubscribe()
      } else if (clientRef.current && subIdRef.current) {
        clientRef.current.unsubscribe(subIdRef.current)
      }
    } catch {
      // noop — ignore if already unsubscribed or connection is gone
    } finally {
      subRef.current = null
      subIdRef.current = null
    }
  }, [])

  const disconnect = useCallback(async () => {
    unsubscribe()
    try {
      if (clientRef.current) {
        await clientRef.current.deactivate()
      }
    } catch {
      // noop
    } finally {
      clientRef.current = null
      setStatus('closed')
    }
  }, [unsubscribe])

  const appendOptimisticMe = useCallback(
    (tempId: string, text: string) => {
      const now = new Date()
      const time = new Intl.DateTimeFormat('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now)

      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          type: 'me',
          senderId: myUserId ?? undefined,
          text,
          time,
          createdAt: now.toISOString(),
        },
      ])
    },
    [myUserId],
  )

  useEffect(() => {
    if (!canConnect) return

    const sessionKey = `room:${roomId}|token:${accessToken}`
    if (sessionKeyRef.current === sessionKey && clientRef.current?.connected) {
      return // Already connected with these exact credentials — skip.
    }

    sessionKeyRef.current = sessionKey
    setStatus('connecting')

    let cancelled = false

    ;(async () => {
      // Tear down any previous client before creating a new one.
      if (clientRef.current) {
        await disconnect()
      }
      if (cancelled) return

      const client = new Client({
        brokerURL: STORIX_STOMP_BROKER_URL,
        reconnectDelay: 3000,
        debug: (msg) => {
          console.debug('[STOMP]', msg)
        },
        connectHeaders: {
          // JWT is required by the server STOMP endpoint.
          Authorization: `Bearer ${accessToken}`,
        },
        onConnect: () => {
          if (cancelled) return
          setStatus('open')

          const subId = makeSubscriptionId(roomId)
          subIdRef.current = subId

          // On reconnect, clean up the previous subscription before re-subscribing.
          unsubscribe()

          subRef.current = client.subscribe(
            topicRoomSubPath(roomId),
            (frame) => {
              const uiMsg = normalizeTopicRoomStompMessage(frame.body, { myUserId })
              if (!uiMsg) return

              // If this is an echo of a message I just sent, replace the optimistic
              // entry (temp id → server id) instead of appending a duplicate.
              if (uiMsg.type === 'me') {
                const now = Date.now()
                const idx = pendingSentRef.current.findIndex(
                  (p) => p.text === uiMsg.text && now - p.at < 5000,
                )

                if (idx !== -1) {
                  const matched = pendingSentRef.current[idx]
                  pendingSentRef.current.splice(idx, 1)

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === matched.tempId
                        ? {
                            ...m,
                            id: uiMsg.id,
                            time: uiMsg.time || m.time,
                            createdAt: uiMsg.createdAt ?? m.createdAt,
                            senderId: uiMsg.senderId ?? m.senderId,
                          }
                        : m,
                    ),
                  )
                  return
                }
              }

              setMessages((prev) => [...prev, uiMsg])
            },
            { id: subId },
          )

          console.log('[STOMP] connected', roomId)
        },
        onWebSocketClose: (event) => {
          if (cancelled) return
          // window.location.origin removed — not available in React Native.
          console.warn('[STOMP] websocket closed', {
            roomId,
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          })
          setStatus('closed')
        },
        onWebSocketError: (event) => {
          if (cancelled) return
          // window.location.origin removed — not available in React Native.
          console.error('[STOMP] websocket error', { roomId, event })
          setStatus('error')
        },
        onStompError: (frame: IFrame) => {
          if (cancelled) return
          console.error('[STOMP] broker error', {
            roomId,
            headers: frame.headers,
            body: frame.body,
          })
          setStatus('error')
        },
      })

      clientRef.current = client
      client.activate()
    })()

    return () => {
      cancelled = true
      // Explicit UNSUBSCRIBE + deactivate on unmount / room navigation away.
      void disconnect()
    }
    // disconnect/unsubscribe are stable callbacks — intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canConnect, roomId, accessToken, myUserId])

  const sendMessage = useCallback(
    (text: string): boolean => {
      const t = text.trim()
      if (!t) return false

      const client = clientRef.current
      if (!client || !client.connected) return false

      const tempId = `me_tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`
      pendingSentRef.current.push({ tempId, text: t, at: Date.now() })
      appendOptimisticMe(tempId, t)

      client.publish({
        destination: topicRoomPubPath(),
        body: JSON.stringify({ roomId, type: 'TALK', message: t }),
      })

      return true
    },
    [appendOptimisticMe, roomId],
  )

  return { status, messages, sendMessage, disconnect, unsubscribe }
}
