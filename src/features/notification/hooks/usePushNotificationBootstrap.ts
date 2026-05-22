import { getApps } from "@react-native-firebase/app";
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";
import { useEffect, useRef } from "react";

import { useAuthStore } from "../../../store/auth.store";
import { subscribeFcmTokenRefresh } from "../services/fcmToken";
import { handleFcmTokenRefresh } from "../services/pushDeviceSync";
import { usePushDeviceSync } from "./usePushDeviceSync";

// Attaches the foreground / opened-from-bg / cold-start handlers. Returns a
// single cleanup that detaches both subscriptions. The handlers are currently
// no-ops — actual payload routing will land with PUSH-2-BACKGROUND and the
// notification-centre UI work.
const attachMessageListeners = (): (() => void) => {
  try {
    if (getApps().length === 0) return () => {};
    const msg = getMessaging();

    const unsubMessage = onMessage(msg, async () => {
      // Foreground messages: iOS/Android intentionally do not show an OS
      // banner. In-app UI will be wired up in a later PUSH phase.
    });

    const unsubOpened = onNotificationOpenedApp(msg, () => {
      // Background → tap: deep-link routing lands with PUSH-4-UI.
    });

    void getInitialNotification(msg).catch((err) => {
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

    try {
      if (getApps().length === 0) return;
    } catch {
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
