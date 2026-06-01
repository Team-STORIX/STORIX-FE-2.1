import { router } from "expo-router";
import { useEffect, useRef } from "react";

import { queryClient } from "../../../lib/query/queryClient";
import { useAuthStore } from "../../../store/auth.store";
import { markNotificationRead } from "../api/notification.api";
import { notificationKeys } from "../api/notification.keys";
import { subscribeFcmTokenRefresh } from "../services/fcmToken";
import {
  getFirebaseMessagingIfAvailable,
  isFirebaseNativeAvailable,
} from "../services/firebaseNative";
import { handleFcmTokenRefresh } from "../services/pushDeviceSync";
import {
  getNotificationRoute,
  getPushTitleBody,
  parsePushNotificationData,
} from "../services/pushPayload";
import { usePushDeviceSync } from "./usePushDeviceSync";

// Local-notification capability.
//
// As of this phase the project has NO local-notification library installed
// (checked package.json: no @notifee/react-native, expo-notifications, or
// react-native-push-notification). Per the phase spec we therefore DO NOT fake
// an OS notification with Alert; foreground receipt is logged in __DEV__ only.
//
// RECOMMENDATION: install @notifee/react-native (preferred for RNFirebase
// projects — richer press handling) or expo-notifications to actually surface
// a banner while the app is foregrounded. Once present, display the
// notification here with the parsed title/body and attach the `data` bag so the
// press handler can call `handleNotificationOpen(data)`.
const HAS_LOCAL_NOTIFICATION_LIB = false;

/**
 * Shared click handler for opened-from-background, cold-start, and (future)
 * local-notification presses. Runs OUTSIDE React, so it talks to the API and
 * query cache directly and navigates via the expo-router imperative singleton.
 *
 * Never throws; navigation is never blocked on the mark-as-read result.
 */
async function handleNotificationOpen(data: unknown): Promise<void> {
  const payload = parsePushNotificationData(data);

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
      })
      .catch((err) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[push] markNotificationRead failed", err);
        }
      });
  }

  const route = getNotificationRoute(payload);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[PUSH_RECEIVE_DEBUG] route decision", { route });
  }

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

// Attaches the foreground / opened-from-bg / cold-start handlers. Returns a
// single cleanup that detaches both subscriptions.
const attachMessageListeners = (): (() => void) => {
  try {
    const firebase = getFirebaseMessagingIfAvailable();
    if (!firebase) return () => {};
    const { messagingModule, messaging } = firebase;

    const unsubMessage = messagingModule.onMessage(messaging, async (remoteMessage) => {
      // Foreground messages. iOS does NOT automatically show a banner for a
      // foreground remote message, and Android only shows one in the
      // background; so to surface a foreground notification we must display a
      // local notification manually. Read title/body from data.* first (per
      // the backend contract), falling back to the `notification` block.
      const payload = parsePushNotificationData(remoteMessage?.data);
      const { title, body } = getPushTitleBody(payload, {
        title: remoteMessage?.notification?.title,
        body: remoteMessage?.notification?.body,
      });

      if (HAS_LOCAL_NOTIFICATION_LIB) {
        // TODO(PUSH-LOCAL-NOTIFICATION): once a local-notification library is
        // installed, display { title, body } here and attach
        // `remoteMessage?.data` so the press callback can invoke
        // `handleNotificationOpen(data)`.
      } else if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log("[PUSH_RECEIVE_DEBUG] foreground push received", {
          title,
          body,
          dataKeys: payload ? Object.keys(payload.raw) : [],
        });
      }
    });

    const unsubOpened = messagingModule.onNotificationOpenedApp(messaging, (remoteMessage) => {
      // Background → tap.
      void handleNotificationOpen(remoteMessage?.data);
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

    return () => {
      unsubMessage();
      unsubOpened();
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

  // Backend reconcile (permission / token / meta) on auth + foreground.
  usePushDeviceSync();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!isFirebaseNativeAvailable()) {
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

// TODO(PUSH-2-BACKGROUND): wire setBackgroundMessageHandler at module entry
// (e.g. via expo-router's root entry) once the notification payload contract
// is defined. Doing it inside a React effect is too late — RNFirebase requires
// the handler to be registered before the JS engine starts handling pushes.
