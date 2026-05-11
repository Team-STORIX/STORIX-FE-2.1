import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuthStore } from "../../../store/auth.store";
import { registerDeviceToken } from "../api/notification.api";
import {
  getFcmDeviceToken,
  subscribeFcmTokenRefresh,
} from "../services/fcmToken";
import { requestPushPermission } from "../services/pushPermission";
import type { RegisterDeviceTokenPayload } from "../types";

// Module-level guards so the bootstrap flow runs exactly once per app
// session, even if the host component re-mounts (e.g. theme toggle,
// auth re-hydration). The map keys are per-token to allow re-registering
// after a token rotation.
let permissionFlowRan = false;
const registeredTokens = new Set<string>();

const platformForPayload = (): RegisterDeviceTokenPayload["platform"] =>
  Platform.OS === "ios" ? "IOS" : "ANDROID";

const safeRegister = async (token: string): Promise<void> => {
  if (registeredTokens.has(token)) return;
  try {
    await registerDeviceToken({
      deviceToken: token,
      platform: platformForPayload(),
    });
    registeredTokens.add(token);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[push] registerDeviceToken failed", err);
    }
  }
};

/**
 * Push notification bootstrap. Mount once inside the authenticated subtree
 * (after the auth store has hydrated and the user is signed in).
 *
 * Responsibilities:
 *  1. Ask the OS for push permission — once per app session.
 *  2. If granted, fetch the FCM token and register it with the backend.
 *  3. Listen for token rotation and re-register the new value.
 *  4. Log foreground messages in dev so engineers can see test pushes land.
 *
 * Never throws, never blocks rendering. If anything fails the hook simply
 * leaves the device unregistered — the user can retry from settings later.
 */

export const usePushNotificationBootstrap = (): void => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // useRef so cleanup can fire even after the component unmounts mid-bootstrap.
  const cleanupRef = useRef<(() => void) | null>(null);
  console.log("[PUSH_DEBUG] bootstrap render", {
    isAuthenticated,
  });
  useEffect(() => {
    if (!isAuthenticated) return;
    if (permissionFlowRan) {
      // Permission flow already ran this session — only (re)attach the
      // refresh listener and dev foreground listener.
      const unsubRefresh = subscribeFcmTokenRefresh((newToken) => {
        void safeRegister(newToken);
      });
      const unsubMessage = onMessage(getMessaging(), async (remoteMessage) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log("[push] foreground message", remoteMessage);
        }
      });
      cleanupRef.current = () => {
        unsubRefresh();
        unsubMessage();
      };
      return () => {
        cleanupRef.current?.();
        cleanupRef.current = null;
      };
    }

    permissionFlowRan = true;
    let cancelled = false;

    void (async () => {
      const permission = await requestPushPermission();
      if (cancelled) return;

      if (!permission.granted) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log("[push] permission not granted", permission);
        }
        return;
      }

      const token = await getFcmDeviceToken();
      if (cancelled || !token) return;

      await safeRegister(token);
    })();

    const unsubRefresh = subscribeFcmTokenRefresh((newToken) => {
      void safeRegister(newToken);
    });
    const unsubMessage = onMessage(getMessaging(), async (remoteMessage) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log("[push] foreground message", remoteMessage);
      }
    });
    cleanupRef.current = () => {
      unsubRefresh();
      unsubMessage();
    };

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isAuthenticated]);
};

// TODO(PUSH-2-BACKGROUND): wire setBackgroundMessageHandler at module entry
// (e.g. via expo-router's root entry) once the notification payload contract
// is defined. Doing it inside a React effect is too late — RNFirebase requires
// the handler to be registered before the JS engine starts handling pushes.
