import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, Linking } from "react-native";

import { queryClient } from "../../../lib/query/queryClient";
import { useAuthStore } from "../../../store/auth.store";
import { markNotificationRead } from "../api/notification.api";
import { notificationKeys } from "../api/notification.keys";
import { subscribeFcmTokenRefresh } from "../services/fcmToken";
import {
  getFirebaseNativeUnavailableReason,
  getFirebaseMessagingIfAvailable,
  isFirebaseNativeAvailable,
} from "../services/firebaseNative";
import { handleFcmTokenRefresh } from "../services/pushDeviceSync";
import { consumePendingNotificationOpenData } from "../services/pendingNotificationOpen";
import {
  displayForegroundPushNotification,
  ensurePushNotificationChannel,
  getInitialNotifeeNotificationData,
  refreshAppBadgeCount,
  setAppBadgeCount,
  subscribeNotifeeForegroundPress,
  syncAppBadgeCountFromPushData,
} from "../services/notifeeNative";
import {
  getNotificationRoute,
  parsePushNotificationData,
} from "../services/pushPayload";
import { getValidHttpUrl } from '../../app-event/lib/targetNavigation'
import { usePushDeviceSync } from "./usePushDeviceSync";

/**
 * Shared click handler for opened-from-background, cold-start, and (future)
 * local-notification presses. Runs OUTSIDE React, so it talks to the API and
 * query cache directly and navigates via the expo-router imperative singleton.
 *
 * Never throws; navigation is never blocked on the mark-as-read result.
 */
async function handleNotificationOpen(data: unknown): Promise<void> {
  const payload = parsePushNotificationData(data);

  const openKey = payload
    ? `${payload.type ?? ''}:${payload.threadId ?? ''}:${payload.targetType}:${payload.targetId ?? ''}`
    : null;
  const now = Date.now();
  if (
    openKey != null &&
    openKey === lastNotificationOpenKey &&
    now - lastNotificationOpenAt < 1_500
  ) {
    return;
  }
  lastNotificationOpenKey = openKey;
  lastNotificationOpenAt = now;

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[PUSH_RECEIVE_DEBUG] notification opened", {
      type: payload?.type,
      targetType: payload?.targetType,
      targetId: payload?.targetId,
      parentTargetId: payload?.parentTargetId,
      notificationId: payload?.notificationId,
    });
  }

  // Mark-as-read: fire-and-forget so navigation is never blocked. The next
  // list/unread-count fetch will reflect the change; we also nudge the cache.
  if (payload?.notificationId != null) {
    const id = payload.notificationId;
    markNotificationRead(id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.listRoot });
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount,
        });
        return refreshBadgeCountState()
      })
      .catch((err) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[push] markNotificationRead failed", err);
        }
      });
  }

  const externalUrl =
    payload?.targetType === 'EXTERNAL'
      ? getValidHttpUrl(payload.targetLink)
      : null
  if (externalUrl) {
    void Linking.openURL(externalUrl).catch((err) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[push] external link failed", err);
      }
    });
    return;
  }

  const route = getNotificationRoute(payload);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[PUSH_RECEIVE_DEBUG] route decision", { route });
  }
  if (route == null) return;

  try {
    // expo-router accepts both a string path and a { pathname, params } object.
    router.push(route as never);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[push] navigation failed, falling back", err);
    }
    router.push("/notifications" as never);
  }
}

let lastNotificationOpenKey: string | null = null;
let lastNotificationOpenAt = 0;

function consumePendingNotificationOpen(): void {
  void consumePendingNotificationOpenData()
    .then((data) => {
      if (data) void handleNotificationOpen(data);
    })
    .catch((err) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[push] pending notification open failed', err);
      }
    });
}

async function refreshBadgeCountState(): Promise<void> {
  const count = await refreshAppBadgeCount()
  queryClient.setQueryData(notificationKeys.badgeCount, count)
}

function invalidateTopicRoomUnreadState(): void {
  void queryClient.invalidateQueries({ queryKey: ['topicroom', 'unread'] })
  void queryClient.invalidateQueries({ queryKey: ['topicroom', 'me'] })
}

// Attaches the foreground / opened-from-bg / cold-start handlers. Returns a
// single cleanup that detaches both subscriptions.
const attachMessageListeners = (): (() => void) => {
  try {
    const firebase = getFirebaseMessagingIfAvailable();
    if (!firebase) return () => {};
    const { messagingModule, messaging } = firebase;

    void ensurePushNotificationChannel().catch((err) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[push] ensure channel failed", err);
      }
    });

    const unsubMessage = messagingModule.onMessage(messaging, async (remoteMessage) => {
      // Foreground messages. iOS does NOT automatically show a banner for a
      // foreground remote message, and Android only shows one in the
      // background; so to surface a foreground notification we must display a
      // local notification manually. Read title/body from data.* first (per
      // the backend contract), falling back to the `notification` block.
      const payload = parsePushNotificationData(remoteMessage?.data);

      const unreadCount = await syncAppBadgeCountFromPushData(remoteMessage?.data).catch((err) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[push] badge sync from foreground push failed", err);
        }
        return null
      });
      if (unreadCount != null) {
        queryClient.setQueryData(notificationKeys.badgeCount, unreadCount)
      }
      if (payload?.targetType === 'TOPIC_ROOM') {
        invalidateTopicRoomUnreadState()
      }

      await displayForegroundPushNotification({
        payload,
        notification: {
          title: remoteMessage?.notification?.title,
          body: remoteMessage?.notification?.body,
        },
      }).catch((err) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[push] foreground notification display failed", err);
        }
      });

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log("[PUSH_RECEIVE_DEBUG] foreground push received", {
          title: payload?.title ?? remoteMessage?.notification?.title ?? '',
          body: payload?.body ?? remoteMessage?.notification?.body ?? '',
          dataKeys: payload ? Object.keys(payload.raw) : [],
        });
      }
    });

    const unsubOpened = messagingModule.onNotificationOpenedApp(messaging, (remoteMessage) => {
      // Background → tap.
      void handleNotificationOpen(remoteMessage?.data);
    });

    const unsubNotifeePress = subscribeNotifeeForegroundPress((data) => {
      void handleNotificationOpen(data);
    });

    void messagingModule.getInitialNotification(messaging)
      .then((remoteMessage) => {
        // Cold start from a tapped notification.
        if (remoteMessage) void handleNotificationOpen(remoteMessage.data);
      })
      .catch((err) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[push] getInitialNotification failed", err);
        }
      });

    void getInitialNotifeeNotificationData()
      .then((data) => {
        if (data) void handleNotificationOpen(data);
      })
      .catch((err) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[push] getInitialNotifeeNotification failed", err);
        }
      });

    return () => {
      unsubMessage();
      unsubOpened();
      unsubNotifeePress();
    };
  } catch {
    return () => {};
  }
};

/**
 * Push notification bootstrap. Mount once inside the authenticated subtree
 * (after the auth store has hydrated and the user is signed in).
 *
 * Responsibilities:
 *  1. Reconcile the device with the push-device backend (permission, FCM
 *     token, installationId, device meta) on auth + app foreground — delegated
 *     to usePushDeviceSync().
 *  2. Listen for FCM token rotation and update the backend (PATCH /fcm-token,
 *     falling back to a full /sync if needed).
 *  3. Attach foreground / opened / cold-start message listeners.
 *
 * Never throws, never blocks rendering. If anything fails the hook simply
 * leaves the device unsynced — it retries on the next auth/foreground event.
 */
export const usePushNotificationBootstrap = (): void => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // useRef so cleanup can fire even after the component unmounts mid-bootstrap.
  const cleanupRef = useRef<(() => void) | null>(null);
  const warnedUnavailable = useRef(false);

  // Backend reconcile (permission / token / meta) on auth + foreground.
  usePushDeviceSync();

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.setQueryData(notificationKeys.badgeCount, 0);
      void setAppBadgeCount(0);
      return;
    }

    void refreshBadgeCountState().catch((err) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[push] app-resume badge sync failed", err);
      }
    });
    consumePendingNotificationOpen();
    invalidateTopicRoomUnreadState();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      invalidateTopicRoomUnreadState();
      setTimeout(consumePendingNotificationOpen, 250);
      void refreshBadgeCountState().catch((err) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[push] app-resume badge sync failed", err);
        }
      });
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!isFirebaseNativeAvailable()) {
      if (__DEV__ && !warnedUnavailable.current) {
        warnedUnavailable.current = true;
        // eslint-disable-next-line no-console
        console.warn(
          "[push] listeners skipped:",
          getFirebaseNativeUnavailableReason() ?? "unknown Firebase state",
        );
      }
      return;
    }

    const unsubRefresh = subscribeFcmTokenRefresh((newToken) => {
      void handleFcmTokenRefresh(newToken);
    });
    const unsubMessages = attachMessageListeners();
    cleanupRef.current = () => {
      unsubRefresh();
      unsubMessages();
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isAuthenticated]);
};
