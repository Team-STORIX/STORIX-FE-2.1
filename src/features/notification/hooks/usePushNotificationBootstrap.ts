import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";
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
  if (registeredTokens.has(token)) {
    // eslint-disable-next-line no-console
    console.log("[PUSH_DIAG] safeRegister skipped (already registered)");
    return;
  }
  try {
    await registerDeviceToken({
      deviceToken: token,
      platform: platformForPayload(),
    });
    registeredTokens.add(token);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("[PUSH_DIAG] registerDeviceToken threw", err);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[push] registerDeviceToken failed", err);
    }
  }
};

// Attaches the foreground / opened-from-bg / cold-start handlers. Returns a
// single cleanup that detaches both subscriptions. Pulled out of the main
// hook so the "permissionFlowRan already" and first-run branches don't
// duplicate the body.
const attachMessageListeners = (): (() => void) => {
  // eslint-disable-next-line no-console
  console.log("[PUSH_DIAG] foreground onMessage listener mounted");
  const unsubMessage = onMessage(getMessaging(), async (remoteMessage) => {
    // NOTE: onMessage fires when a push arrives while the app is in the
    // FOREGROUND. iOS/Android intentionally do NOT show an OS banner in
    // that state — the app is supposed to render its own in-app UI. So
    // "no banner during a foreground test" does not mean delivery is
    // broken; if this log fires, delivery is working end-to-end.
    // eslint-disable-next-line no-console
    console.log("[PUSH_DIAG] foreground message (delivery OK, no OS banner expected)", remoteMessage);
  });

  // eslint-disable-next-line no-console
  console.log("[PUSH_DIAG] onNotificationOpenedApp listener mounted");
  const unsubOpened = onNotificationOpenedApp(
    getMessaging(),
    (remoteMessage) => {
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] notification opened (background → tap)", remoteMessage);
    },
  );

  // getInitialNotification resolves with the notification the user tapped to
  // launch the app from a fully killed state, or null. Fire-and-log.
  void getInitialNotification(getMessaging())
    .then((remoteMessage) => {
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] initial notification (cold launch)", remoteMessage);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] getInitialNotification error", err);
    });

  return () => {
    // eslint-disable-next-line no-console
    console.log("[PUSH_DIAG] foreground + opened listeners unmounted");
    unsubMessage();
    unsubOpened();
  };
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
  // eslint-disable-next-line no-console
  console.log("[PUSH_DIAG] bootstrap render", { isAuthenticated });

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[PUSH_DIAG] bootstrap effect start", {
      isAuthenticated,
      permissionFlowRan,
    });
    if (!isAuthenticated) {
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] bootstrap effect skipped (not authenticated)");
      return;
    }
    if (permissionFlowRan) {
      // Permission flow already ran this session — only (re)attach the
      // refresh listener and dev foreground listener.
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] bootstrap effect: permission flow already ran, re-attaching listeners only");
      const unsubRefresh = subscribeFcmTokenRefresh((newToken) => {
        void safeRegister(newToken);
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
    }

    permissionFlowRan = true;
    let cancelled = false;

    void (async () => {
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] bootstrap async chain start");
      const permission = await requestPushPermission();
      if (cancelled) {
        // eslint-disable-next-line no-console
        console.log("[PUSH_DIAG] bootstrap cancelled after permission");
        return;
      }

      if (!permission.granted) {
        // eslint-disable-next-line no-console
        console.log("[PUSH_DIAG] permission not granted, skipping token sync", permission);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log("[push] permission not granted", permission);
        }
        return;
      }

      const token = await getFcmDeviceToken();
      if (cancelled) {
        // eslint-disable-next-line no-console
        console.log("[PUSH_DIAG] bootstrap cancelled after getFcmDeviceToken");
        return;
      }
      if (!token) {
        // eslint-disable-next-line no-console
        console.log("[PUSH_DIAG] token sync skipped (no token)");
        return;
      }

      await safeRegister(token);
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] bootstrap async chain end");
    })();

    const unsubRefresh = subscribeFcmTokenRefresh((newToken) => {
      void safeRegister(newToken);
    });
    const unsubMessages = attachMessageListeners();
    cleanupRef.current = () => {
      unsubRefresh();
      unsubMessages();
    };

    return () => {
      // eslint-disable-next-line no-console
      console.log("[PUSH_DIAG] bootstrap effect cleanup");
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isAuthenticated]);
};

// Dev-only helper. Call from a debugger / REPL during diagnosis:
//   await import('@/features/notification').then(m => m.dumpPushDiagnostics())
// Prints the current permission status + FCM token + iOS APNs token. Never
// imported by production UI.
export const dumpPushDiagnostics = async (): Promise<void> => {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log("[PUSH_DIAG] dumpPushDiagnostics start");
  const permission = await requestPushPermission();
  // eslint-disable-next-line no-console
  console.log("[PUSH_DIAG] dump permission", permission);
  const token = await getFcmDeviceToken();
  // eslint-disable-next-line no-console
  console.log("[PUSH_DIAG] dump token", token);
};

// TODO(PUSH-2-BACKGROUND): wire setBackgroundMessageHandler at module entry
// (e.g. via expo-router's root entry) once the notification payload contract
// is defined. Doing it inside a React effect is too late — RNFirebase requires
// the handler to be registered before the JS engine starts handling pushes.
//
// TODO(PUSH_DIAG): remove [PUSH_DIAG] logs once the delivery issue is
// resolved and the QA checklist in PUSH_NOTIFICATION_SETUP.md passes.
