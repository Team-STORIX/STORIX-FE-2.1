import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs'
import { getAccessToken } from '../../../lib/storage/secure'
import { refreshAuthTokens } from '../../../lib/auth/refresh-token'
import {
  getJwtSecondsUntilExpiry,
  isJwtExpiringSoon,
} from '../../../lib/utils/jwt'
import { useAuthStore } from '../../../store/auth.store'
import { useProfileStore } from '../../profile/store/profile.store'
import {
  STORIX_STOMP_BROKER_URL,
  isIgnorableStompBody,
  isIgnoredStompEventType,
  makeSubscriptionId,
  normalizeTopicRoomActiveUsersMessage,
  normalizeTopicRoomStompObject,
  parseStompBodyJson,
  topicRoomActiveUsersSubPath,
  topicRoomPubPath,
  topicRoomSubPath,
} from '../stomp'
import type { TopicRoomUiMsg } from '../stomp'

// text-encoding polyfill for @stomp/stompjs is imported in app/_layout.tsx.
// @stomp/stompjs v7 uses native WebSocket via brokerURL — SockJS is not used.

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

// Refresh the access token before CONNECT if it expires within this window.
// Kept in the 30–60s band so a token that dies mid-handshake never reaches the
// server (which would answer STOMP ERROR message=UNAUTHORIZED + close 1002).
const TOKEN_REFRESH_SKEW_SEC = 45

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

// Dev-only: describes an incoming STOMP frame body without leaking full text.
// bodyPreview is capped at 200 chars; when the body is JSON only the top-level
// keys are surfaced (never the values).
const describeIncomingBody = (body?: string) => {
  const hasBody = !!body && body.length > 0
  const bodyLength = body?.length ?? 0
  const bodyPreview = hasBody ? body!.slice(0, 200) : ''
  let bodyJsonKeys: string[] | undefined
  if (hasBody) {
    try {
      const parsed = JSON.parse(body!)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        bodyJsonKeys = Object.keys(parsed as Record<string, unknown>)
      }
    } catch {
      // not JSON — bodyPreview alone is logged (see Part A/B)
    }
  }
  return { hasBody, bodyLength, bodyPreview, bodyJsonKeys }
}

const MEMBER_EVENT_TYPES = new Set([
  'ENTER',
  'JOIN',
  'LEAVE',
  'EXIT',
  'QUIT',
  'MEMBER_ENTER',
  'MEMBER_LEAVE',
])

export const useTopicRoomStomp = (params: {
  roomId: number
  enabled?: boolean
  onMemberChange?: (activeUserNumber?: number) => void
  onActiveUserNumber?: (activeUserNumber: number) => void
  onReconnect?: () => void
}) => {
  const {
    roomId,
    enabled = true,
    onMemberChange,
    onActiveUserNumber,
    onReconnect,
  } = params
  const { accessToken } = useAuthStore()
  const myUserId = useProfileStore((s) => s.me?.userId ?? null)
  const myUserIdRef = useRef<number | null>(myUserId)
  const onMemberChangeRef = useRef<typeof onMemberChange>(onMemberChange)
  const onActiveUserNumberRef =
    useRef<typeof onActiveUserNumber>(onActiveUserNumber)
  const onReconnectRef = useRef<typeof onReconnect>(onReconnect)

  const clientRef = useRef<Client | null>(null)
  const subRef = useRef<StompSubscription | null>(null)
  const activeUsersSubRef = useRef<StompSubscription | null>(null)
  const subIdRef = useRef<string | null>(null)
  const activeUsersSubIdRef = useRef<string | null>(null)

  // Dev-only: counts connect attempts within one mount to surface reconnect loops.
  const connectAttemptRef = useRef<number>(0)
  const hasConnectedOnceRef = useRef(false)

  // Guards the reactive refresh in onStompError so a persistently-rejected token
  // triggers at most one forced refresh per connection instead of an infinite
  // refresh→reconnect→UNAUTHORIZED loop. Reset on a successful onConnect.
  const unauthorizedRefreshAttemptedRef = useRef<boolean>(false)

  // Tracks optimistic messages sent by this client pending server echo.
  const pendingSentRef = useRef<Array<{ tempId: string; text: string; at: number }>>([])

  const [status, setStatus] = useState<Status>('idle')
  const [messages, setMessages] = useState<TopicRoomUiMsg[]>([])
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState === 'active',
  )

  // Mirror of `status` readable inside async/event closures without re-subscribing.
  const statusRef = useRef<Status>('idle')
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Depend on token *presence*, not its value: the CONNECT frame always reads
  // the freshest token from SecureStore (see beforeConnect), so a silent refresh
  // rotating the store token must not tear down and rebuild a healthy socket.
  const hasToken = !!accessToken
  const canConnect = useMemo(
    () => enabled && appIsActive && !!roomId && hasToken,
    [appIsActive, enabled, roomId, hasToken],
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppIsActive(nextState === 'active')
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    setMessages([])
    pendingSentRef.current = []
    hasConnectedOnceRef.current = false
  }, [roomId])

  useEffect(() => {
    myUserIdRef.current = myUserId
  }, [myUserId])

  useEffect(() => {
    onMemberChangeRef.current = onMemberChange
  }, [onMemberChange])

  useEffect(() => {
    onActiveUserNumberRef.current = onActiveUserNumber
  }, [onActiveUserNumber])

  useEffect(() => {
    onReconnectRef.current = onReconnect
  }, [onReconnect])

  const unsubscribe = useCallback(() => {
    try {
      if (subRef.current) {
        subRef.current.unsubscribe()
      } else if (clientRef.current && subIdRef.current) {
        clientRef.current.unsubscribe(subIdRef.current)
      }
      if (activeUsersSubRef.current) {
        activeUsersSubRef.current.unsubscribe()
      } else if (clientRef.current && activeUsersSubIdRef.current) {
        clientRef.current.unsubscribe(activeUsersSubIdRef.current)
      }
    } catch {
      // noop — ignore if already unsubscribed or connection is gone
    } finally {
      subRef.current = null
      subIdRef.current = null
      activeUsersSubRef.current = null
      activeUsersSubIdRef.current = null
    }
  }, [])

  const disconnect = useCallback(async () => {
    const client = clientRef.current
    unsubscribe()
    if (clientRef.current === client) clientRef.current = null
    try {
      if (client) {
        await client.deactivate()
        if (__DEV__) {
          console.debug('[STOMP_DIAG] deactivated', { roomId })
        }
      }
    } catch {
      // noop
    } finally {
      // An older async deactivate must never close or clear a newer session.
      if (!clientRef.current) setStatus('closed')
    }
  }, [unsubscribe, roomId])

  // Returns a usable access token for the STOMP CONNECT frame, refreshing first
  // when the current one is missing / expired / near-expiry. Returns null when no
  // usable token can be obtained — the caller must then NOT connect with a known
  // bad token (that is what the server rejects with UNAUTHORIZED + close 1002).
  const ensureFreshAccessTokenForStomp = useCallback(
    async (forLogRoomId: number): Promise<string | null> => {
      const current = await getAccessToken()
      const expiresInSec = getJwtSecondsUntilExpiry(current)
      const expiringSoon = isJwtExpiringSoon(current, TOKEN_REFRESH_SKEW_SEC)
      const willRefresh = !current || expiringSoon

      if (__DEV__) {
        console.debug('[STOMP_AUTH] before-connect-token', {
          roomId: forLogRoomId,
          hasToken: !!current,
          isExpired:
            typeof expiresInSec === 'number' ? expiresInSec <= 0 : false,
          expiresInSec: expiresInSec ?? undefined,
          willRefresh,
        })
      }

      if (current && !expiringSoon) return current

      const result = await refreshAuthTokens()
      if (result.ok) {
        if (__DEV__) {
          console.debug('[STOMP_AUTH] refresh-success', {
            roomId: forLogRoomId,
            accessTokenPreview: `Bearer ${maskToken(result.accessToken)}`,
            expiresInSec:
              getJwtSecondsUntilExpiry(result.accessToken) ?? undefined,
          })
        }
        return result.accessToken
      }

      if (__DEV__) {
        console.warn('[STOMP_AUTH] refresh-failed', {
          roomId: forLogRoomId,
          errorName:
            result.reason === 'no-refresh-token'
              ? 'NoRefreshToken'
              : result.errorName,
          status: result.status,
        })
      }
      return null
    },
    [],
  )

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
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectionTimeout: 10000,
        discardWebsocketOnCommFailure: true,
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
          // Proactively refresh an expired/near-expired token BEFORE CONNECT so
          // the server never sees an ExpiredTokenException. Runs on the initial
          // connect and every stompjs auto-reconnect.
          const tokenForConnect = await ensureFreshAccessTokenForStomp(roomId)

          if (!tokenForConnect) {
            // No usable token and refresh failed (e.g. refreshToken also expired).
            // Do NOT connect with a known-bad token — that just loops
            // UNAUTHORIZED→reconnect. Stop the client so the auth flow (next REST
            // 401 → clearAuth) can take over.
            if (__DEV__) {
              console.warn('[STOMP_AUTH] connect-aborted-no-token', { roomId })
            }
            setStatus('error')
            void client.deactivate()
            return
          }

          client.connectHeaders = {
            Authorization: `Bearer ${tokenForConnect}`,
          }
          if (__DEV__) {
            console.debug('[STOMP_DIAG] beforeConnect', {
              brokerURL: STORIX_STOMP_BROKER_URL,
              roomId,
              hasFreshToken: true,
              freshTokenPreview: `Bearer ${maskToken(tokenForConnect)}`,
              connectHeaderKeys: Object.keys(client.connectHeaders ?? {}),
              authorizationExists: !!client.connectHeaders?.Authorization,
            })
          }
        },
        onConnect: (frame: IFrame) => {
          if (cancelled) return
          setStatus('open')
          const isReconnect = hasConnectedOnceRef.current
          hasConnectedOnceRef.current = true
          // Handshake succeeded with the current token — allow a future
          // forced refresh if this connection later goes UNAUTHORIZED.
          unauthorizedRefreshAttemptedRef.current = false

          // On reconnect, clean up the previous subscription before re-subscribing.
          unsubscribe()

          const subId = makeSubscriptionId(roomId)
          const activeUsersSubId = `sub_active_users_${roomId}_${subId}`
          subIdRef.current = subId
          activeUsersSubIdRef.current = activeUsersSubId

          if (__DEV__) {
            console.debug('[STOMP_DIAG] onConnect', {
              roomId,
              connectedHeaders: maskAuthHeaders(frame.headers),
              subscribeDestination: topicRoomSubPath(roomId),
              activeUsersSubscribeDestination: topicRoomActiveUsersSubPath(roomId),
              clientConnected: client.connected,
            })
            console.debug('[STOMP_DIAG] subscribe', {
              destination: topicRoomSubPath(roomId),
              subscriptionId: subId,
            })
            console.debug('[STOMP_DIAG] subscribe', {
              destination: topicRoomActiveUsersSubPath(roomId),
              subscriptionId: activeUsersSubId,
            })
          }

          subRef.current = client.subscribe(
            topicRoomSubPath(roomId),
            (frame) => {
              const body = frame.body
              const destination = frame.headers?.destination
              const command = frame.command

              // Part B — heartbeat / session-alive frames arrive with an empty
              // or whitespace-only body. Never send them through the chat schema.
              if (isIgnorableStompBody(body)) {
                if (__DEV__) {
                  console.debug('[STOMP_PARSE] ignored-heartbeat-or-empty', {
                    destination,
                    command,
                    bodyLength: body?.length ?? 0,
                  })
                }
                return
              }

              const diag = describeIncomingBody(body)
              if (__DEV__) {
                // Part A — incoming-frame diagnostics. Top-level keys only, no
                // message text; bodyPreview capped at 200 chars.
                console.debug('[STOMP_PARSE] incoming-frame', {
                  destination,
                  command,
                  hasBody: diag.hasBody,
                  bodyLength: diag.bodyLength,
                  bodyPreview: diag.bodyPreview,
                  bodyJsonKeys: diag.bodyJsonKeys,
                })
              }

              // Non-JSON body (plain-text keepalive) — ignore this frame only.
              const parsedJson = parseStompBodyJson(body)
              if (!parsedJson.ok) {
                if (__DEV__) {
                  console.debug('[STOMP_PARSE] ignored-non-json', {
                    destination,
                    command,
                    bodyPreview: diag.bodyPreview,
                  })
                }
                return
              }

              const result = normalizeTopicRoomStompObject(parsedJson.value, {
                myUserId: myUserIdRef.current,
              })
              if (!result.ok) {
                if (__DEV__) {
                  // Part A — schema-error. Never crashes the screen; this frame
                  // is dropped and the connection is left untouched.
                  const raw = parsedJson.value as {
                    type?: unknown
                    messageType?: unknown
                  }
                  console.warn('[STOMP_PARSE] schema-error', {
                    zodIssues: result.zodIssues,
                    bodyJsonKeys: diag.bodyJsonKeys,
                    type: raw?.type,
                    messageType: raw?.messageType ?? raw?.type,
                    rawType: result.rawType,
                    bodyLength: diag.bodyLength,
                  })
                }
                return
              }

              const uiMsg = result.uiMsg

              // Part C — transport frames (PING/PONG/ALIVE…) that slipped onto
              // the room destination as JSON: acknowledge, never render.
              if (isIgnoredStompEventType(uiMsg.eventType)) {
                if (__DEV__) {
                  console.debug('[STOMP_PARSE] ignored-heartbeat-or-empty', {
                    destination,
                    command,
                    eventType: uiMsg.eventType,
                  })
                }
                return
              }

              const eventType = uiMsg.eventType?.toUpperCase()
              const isTalkEvent = !eventType || eventType === 'TALK'
              const isMemberEvent =
                !!eventType &&
                (MEMBER_EVENT_TYPES.has(eventType) ||
                  eventType.includes('JOIN') ||
                  eventType.includes('ENTER') ||
                  eventType.includes('LEAVE') ||
                  eventType.includes('EXIT'))

              if (
                typeof uiMsg.activeUserNumber === 'number' ||
                isMemberEvent
              ) {
                onMemberChangeRef.current?.(uiMsg.activeUserNumber)
              }

              if (!isTalkEvent || uiMsg.text.length === 0) return

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

              setMessages((prev) => {
                if (prev.some((message) => message.id === uiMsg.id)) return prev
                return [...prev, uiMsg]
              })
            },
            { id: subId },
          )

          activeUsersSubRef.current = client.subscribe(
            topicRoomActiveUsersSubPath(roomId),
            (frame) => {
              const activeUsers = normalizeTopicRoomActiveUsersMessage(frame.body)
              if (!activeUsers || activeUsers.topicRoomId !== roomId) return
              onActiveUserNumberRef.current?.(activeUsers.activeUserNumber)
            },
            { id: activeUsersSubId },
          )

          if (__DEV__) {
            console.debug('[STOMP] subscribed', topicRoomSubPath(roomId))
            console.debug('[STOMP] subscribed', topicRoomActiveUsersSubPath(roomId))
          }
          console.log('[STOMP] connected', roomId)
          if (isReconnect) onReconnectRef.current?.()
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
          const messageHeader = frame.headers?.message
          // Server rejects an expired/invalid token with STOMP ERROR
          // message=UNAUTHORIZED then closes the socket (code 1002).
          const isUnauthorized =
            /UNAUTHORIZED/i.test(String(messageHeader ?? '')) ||
            /UNAUTHORIZED/i.test(frame.body ?? '')

          if (__DEV__) {
            console.error('[STOMP_DIAG] stompError', {
              command: frame.command,
              headers: safeHeaders,
              body: frame.body,
              roomId,
              brokerURL: STORIX_STOMP_BROKER_URL,
            })
          }

          if (isUnauthorized) {
            const willTryRefresh = !unauthorizedRefreshAttemptedRef.current
            if (__DEV__) {
              console.warn('[STOMP_AUTH] unauthorized-error', {
                roomId,
                messageHeader,
                willTryRefresh,
              })
            }

            if (!willTryRefresh) {
              // Already forced one refresh for this connection and the server
              // still rejects — stop reconnecting to avoid an infinite loop.
              setStatus('error')
              void client.deactivate()
              return
            }

            // Force a refresh regardless of local exp (covers clock skew where
            // the token looks valid to us but the server considers it expired).
            unauthorizedRefreshAttemptedRef.current = true
            void (async () => {
              const result = await refreshAuthTokens()
              if (cancelled) return
              if (result.ok) {
                if (__DEV__) {
                  console.debug('[STOMP_AUTH] refresh-success', {
                    roomId,
                    accessTokenPreview: `Bearer ${maskToken(result.accessToken)}`,
                    expiresInSec:
                      getJwtSecondsUntilExpiry(result.accessToken) ?? undefined,
                  })
                }
                // Fresh token now in SecureStore; stompjs auto-reconnect's
                // beforeConnect will pick it up. Nothing else to do here.
              } else {
                if (__DEV__) {
                  console.warn('[STOMP_AUTH] refresh-failed', {
                    roomId,
                    errorName:
                      result.reason === 'no-refresh-token'
                        ? 'NoRefreshToken'
                        : result.errorName,
                    status: result.status,
                  })
                }
                setStatus('error')
                void client.deactivate()
              }
            })()
            return
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
    // hasToken (not accessToken) is the dep so a silent refresh doesn't reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canConnect, roomId, hasToken])

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
        console.debug('[STOMP_PARSE] publish', {
          destination: topicRoomPubPath(),
          roomId,
          messageType: 'TALK',
          messageLength: t.length,
        })
      }

      // Field names must match the backend ChatMessageRequestDto
      // ({ roomId, message, messageType }) — a `type` key is dropped by Jackson.
      client.publish({
        destination: topicRoomPubPath(),
        body: JSON.stringify({ roomId, message: t, messageType: 'TALK' }),
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
