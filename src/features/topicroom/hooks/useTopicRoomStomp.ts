import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs'
import { getAccessToken } from '../../../lib/storage/secure'
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

// ---------- diagnostic helpers (dev-only) ----------
// All masking keeps a short head/tail for correlation — never a usable token.

// "abc123…wxyz" (or "…" / token length if too short). Strips any "Bearer " prefix.
const maskToken = (token?: string | null): string => {
  if (!token) return '∅'
  const t = token.startsWith('Bearer ') ? token.slice(7) : token
  if (t.length <= 12) return `len:${t.length}`
  return `${t.slice(0, 6)}…${t.slice(-4)}`
}

// Returns header object with Authorization value masked (keys preserved).
const maskAuthHeaders = (
  headers?: Record<string, string> | null,
): Record<string, string> => {
  const out: Record<string, string> = {}
  if (!headers) return out
  for (const [k, v] of Object.entries(headers)) {
    out[k] = /^authorization$/i.test(k) ? maskToken(v) : v
  }
  return out
}

// Redacts Bearer tokens and any "authorization:" line from a raw STOMP frame.
const redactFrame = (msg: string): string =>
  msg
    .split('\n')
    .map((line) =>
      /^\s*authorization\s*:/i.test(line)
        ? line.replace(/(:\s*).*$/, '$1***')
        : line,
    )
    .join('\n')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')

export const useTopicRoomStomp = (params: { roomId: number }) => {
  const { roomId } = params
  const { accessToken } = useAuthStore()
  const myUserId = useProfileStore((s) => s.me?.userId ?? null)
  const myUserIdRef = useRef<number | null>(myUserId)

  const clientRef = useRef<Client | null>(null)
  const subRef = useRef<StompSubscription | null>(null)
  const subIdRef = useRef<string | null>(null)

  // Prevents duplicate connect when roomId/token haven't changed (StrictMode / re-render).
  const sessionKeyRef = useRef<string>('')

  // Dev-only: counts connect attempts within one mount to surface reconnect loops.
  const connectAttemptRef = useRef<number>(0)

  // Tracks optimistic messages sent by this client pending server echo.
  const pendingSentRef = useRef<Array<{ tempId: string; text: string; at: number }>>([])

  const [status, setStatus] = useState<Status>('idle')
  const [messages, setMessages] = useState<TopicRoomUiMsg[]>([])

  // Mirror of `status` readable inside async/event closures without re-subscribing.
  const statusRef = useRef<Status>('idle')
  useEffect(() => {
    statusRef.current = status
  }, [status])

  const canConnect = useMemo(() => !!roomId && !!accessToken, [roomId, accessToken])

  useEffect(() => {
    myUserIdRef.current = myUserId
  }, [myUserId])

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
        if (__DEV__) {
          console.debug('[STOMP_DIAG] deactivated', { roomId })
        }
      }
    } catch {
      // noop
    } finally {
      clientRef.current = null
      setStatus('closed')
    }
  }, [unsubscribe, roomId])

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
          senderId: myUserIdRef.current ?? undefined,
          text,
          time,
          createdAt: now.toISOString(),
        },
      ])
    },
    [],
  )

  // Unmount detector. Defined BEFORE the connect effect so that on a real
  // unmount its cleanup (sets ref = true) runs first; on a deps change it does
  // not re-run, so the connect-effect cleanup can tell the two cases apart.
  const isUnmountingRef = useRef(false)
  useEffect(() => {
    isUnmountingRef.current = false
    return () => {
      isUnmountingRef.current = true
    }
  }, [])

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

      // Use the freshest persisted token. The in-memory store token can go stale
      // after the axios interceptor silently rotates it on a 401 (it writes to
      // SecureStore but does not update the store), which would otherwise make
      // the STOMP CONNECT frame carry an expired token → server closes the
      // socket ("연결 끊김") even though REST calls succeed with the new token.
      const secureToken = await getAccessToken()
      const token = secureToken || accessToken
      if (cancelled) return
      if (!token) {
        setStatus('idle')
        return
      }

      const attempt = (connectAttemptRef.current += 1)

      if (__DEV__) {
        console.debug('[STOMP_DIAG] prepare', {
          roomId,
          roomIdType: typeof roomId,
          canConnect,
          statusBeforeConnect: statusRef.current,
          brokerURL: STORIX_STOMP_BROKER_URL,
          attempt,
          forceBinaryWSFrames: true,
          hasStoreAccessToken: !!accessToken,
          hasSecureStoreAccessToken: !!secureToken,
          storeAccessTokenPreview: `Bearer ${maskToken(accessToken)}`,
          secureStoreAccessTokenPreview: `Bearer ${maskToken(secureToken)}`,
          // No token in the key — roomId + token length only.
          sessionKeyPreview: `room:${roomId}|tokenLen:${token.length}`,
        })
      }

      const client = new Client({
        brokerURL: STORIX_STOMP_BROKER_URL,
        reconnectDelay: 3000,
        // React Native's WebSocket can chop the STOMP NULL terminator off the
        // tail of a text frame, so Spring's STOMP decoder never sees a complete
        // CONNECT command (socket closes before CONNECTED). Sending frames as
        // binary preserves the trailing 0x00 byte intact.
        forceBinaryWSFrames: true,
        debug: (msg) => {
          if (!__DEV__) return
          // stompjs echoes raw frames here, including the CONNECT frame that
          // carries the Bearer token. redactFrame strips "authorization:" lines
          // and any Bearer string so the token never reaches logs.
          console.debug('[STOMP_DIAG] frame', redactFrame(msg))
        },
        connectHeaders: {
          // JWT is required by the server STOMP endpoint.
          Authorization: `Bearer ${token}`,
        },
        // stompjs auto-reconnect (reconnectDelay) reuses the Client config, so a
        // socket that drops after a token rotation would reconnect with the stale
        // token and be closed again — a "connecting → 끊김" loop. Refresh the
        // header from SecureStore before every (re)connect to break that loop.
        beforeConnect: async () => {
          const fresh = await getAccessToken()
          if (fresh) {
            client.connectHeaders = { Authorization: `Bearer ${fresh}` }
          }
          if (__DEV__) {
            console.debug('[STOMP_DIAG] beforeConnect', {
              brokerURL: STORIX_STOMP_BROKER_URL,
              roomId,
              hasFreshToken: !!fresh,
              freshTokenPreview: `Bearer ${maskToken(fresh)}`,
              connectHeaderKeys: Object.keys(client.connectHeaders ?? {}),
              authorizationExists: !!client.connectHeaders?.Authorization,
            })
          }
        },
        onConnect: (frame: IFrame) => {
          if (cancelled) return
          setStatus('open')

          const subId = makeSubscriptionId(roomId)
          subIdRef.current = subId

          // On reconnect, clean up the previous subscription before re-subscribing.
          unsubscribe()

          if (__DEV__) {
            console.debug('[STOMP_DIAG] onConnect', {
              roomId,
              connectedHeaders: maskAuthHeaders(frame.headers),
              subscribeDestination: topicRoomSubPath(roomId),
              clientConnected: client.connected,
            })
            console.debug('[STOMP_DIAG] subscribe', {
              destination: topicRoomSubPath(roomId),
              subscriptionId: subId,
            })
          }

          subRef.current = client.subscribe(
            topicRoomSubPath(roomId),
            (frame) => {
              const uiMsg = normalizeTopicRoomStompMessage(frame.body, {
                myUserId: myUserIdRef.current,
              })
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

          if (__DEV__) {
            console.debug('[STOMP] subscribed', topicRoomSubPath(roomId))
          }
          console.log('[STOMP] connected', roomId)
        },
        onWebSocketClose: (event) => {
          if (cancelled) return
          // window.location.origin removed — not available in React Native.
          if (__DEV__) {
            console.warn('[STOMP_DIAG] websocketClose', {
              code: event?.code,
              reason: event?.reason,
              wasClean: event?.wasClean,
              roomId,
              brokerURL: STORIX_STOMP_BROKER_URL,
              statusBeforeClose: statusRef.current,
              clientConnected: client.connected,
            })
          }
          setStatus('closed')
        },
        onWebSocketError: (event) => {
          if (cancelled) return
          // window.location.origin removed — not available in React Native.
          if (__DEV__) {
            const e = event as any
            console.error('[STOMP_DIAG] websocketError', {
              message: e?.message,
              type: e?.type,
              targetUrl: e?.target?.url ?? e?.target?._url,
              roomId,
              brokerURL: STORIX_STOMP_BROKER_URL,
            })
          }
          setStatus('error')
        },
        onStompError: (frame: IFrame) => {
          if (cancelled) return
          // Strip Authorization so the token never reaches logs.
          const { Authorization: _auth, ...safeHeaders } = frame.headers ?? {}
          if (__DEV__) {
            console.error('[STOMP_DIAG] stompError', {
              command: frame.command,
              headers: safeHeaders,
              body: frame.body,
              roomId,
              brokerURL: STORIX_STOMP_BROKER_URL,
            })
          }
          setStatus('error')
        },
      })

      clientRef.current = client
      client.activate()
    })()

    return () => {
      cancelled = true
      if (__DEV__) {
        console.debug('[STOMP_DIAG] cleanup', {
          roomId,
          reason: isUnmountingRef.current ? 'unmount' : 'deps-change',
          hadClient: !!clientRef.current,
          hadSubscription: !!subRef.current || !!subIdRef.current,
        })
      }
      // Explicit UNSUBSCRIBE + deactivate on unmount / room navigation away.
      void disconnect()
    }
    // disconnect/unsubscribe are stable callbacks — intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canConnect, roomId, accessToken])

  const sendMessage = useCallback(
    (text: string): boolean => {
      const t = text.trim()
      const client = clientRef.current

      if (!t) {
        if (__DEV__) {
          console.warn('[STOMP_DIAG] sendBlocked', {
            reason: 'empty-message',
            roomId,
            status: statusRef.current,
          })
        }
        return false
      }
      if (!client) {
        if (__DEV__) {
          console.warn('[STOMP_DIAG] sendBlocked', {
            reason: 'no-client',
            roomId,
            status: statusRef.current,
          })
        }
        return false
      }
      if (!client.connected) {
        if (__DEV__) {
          console.warn('[STOMP_DIAG] sendBlocked', {
            reason: 'client-not-connected',
            roomId,
            status: statusRef.current,
            clientConnected: client.connected,
          })
        }
        return false
      }

      const tempId = `me_tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`
      pendingSentRef.current.push({ tempId, text: t, at: Date.now() })
      appendOptimisticMe(tempId, t)

      if (__DEV__) {
        // Message length only — never the message body.
        console.debug('[STOMP_DIAG] publish', {
          destination: topicRoomPubPath(),
          roomId,
          messageLength: t.length,
        })
      }

      client.publish({
        destination: topicRoomPubPath(),
        body: JSON.stringify({ roomId, type: 'TALK', message: t }),
      })

      if (__DEV__) {
        console.debug('[STOMP_DIAG] publishSuccess', { tempId })
      }

      return true
    },
    [appendOptimisticMe, roomId],
  )

  return { status, messages, sendMessage, disconnect, unsubscribe }
}
