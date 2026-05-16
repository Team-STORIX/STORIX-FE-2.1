// app.config.ts — Dynamic Expo configuration.
// Reads environment variables at build time so secrets are never committed.
// Run `npx expo prebuild` after filling in .env (see .env.example).

// Load .env eagerly so EXPO_PUBLIC_* vars are populated before requireEnv()
// runs below. Expo CLI also loads .env, but its loader executes AFTER config
// evaluation in some commands, which would defeat our build-time guards.
// `override: false` keeps real environment variables (CI, shell exports)
// taking precedence over .env values.
require("dotenv").config({ override: false });

import { withEntitlementsPlist } from "@expo/config-plugins";
import type { ConfigContext, ExpoConfig } from "expo/config";

// ─── Build-time env var helpers ───────────────────────────────────────────────
// Variables with EXPO_PUBLIC_ prefix are also inlined into the JS bundle.
// Variables without that prefix (EXPO_IOS_BUNDLE_ID etc.) are build-time only.
//
// Required-at-build-time env vars are validated below. Missing values throw
// during config evaluation so prebuild/export fails loudly rather than producing
// a broken native binary. Values themselves are never printed.

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[app.config] Missing required env var: ${name}\n` +
        `  Add it to .env before running prebuild/export. ` +
        `See .env.example for the full list.`,
    );
  }
  return value;
};

// Native-build-time vars (must be embedded into the binary by the config plugin).
const kakaoAppKey = requireEnv("EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY");
// Naver URL scheme must match:
//   1. The "scheme" field in app.json (root deep-link scheme).
//   2. The Naver developer console URL Scheme registration.
//   3. The serviceUrlSchemeIOS arg in NaverLogin.initialize() — see
//      src/lib/auth/social/native.ts ensureNaverInitialized().
// All three reference the same EXPO_PUBLIC_NAVER_URL_SCHEME value.
const naverUrlScheme = requireEnv("EXPO_PUBLIC_NAVER_URL_SCHEME");

// Optional with sensible defaults — not validated.
const iosBundleId = process.env.EXPO_IOS_BUNDLE_ID ?? "kr.storix.app";
const androidPackage = process.env.EXPO_ANDROID_PACKAGE ?? "kr.storix.app";

// Firebase client config files. Both paths are optional at config evaluation
// time so the JS bundle can build without them — but native builds (prebuild)
// will fail loudly if Firebase is enabled and the file is missing. See
// PUSH_NOTIFICATION_SETUP.md for placement instructions.
const androidGoogleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ?? "./android/app/google-services.json";
const iosGoogleServicesPlist =
  process.env.GOOGLE_SERVICE_INFO_PLIST ??
  "./ios/STORIXFE21/GoogleService-Info.plist";

// ─── Apple Sign In entitlement plugin ────────────────────────────────────────
// @invertase/react-native-apple-authentication ships no Expo config plugin.
// Applied as a config wrapper (not in the plugins array) because the ExpoConfig
// type only permits string/tuple entries there — functions must wrap the config.
// Also requires "Sign In with Apple" to be enabled for the bundle ID in the
// Apple Developer portal (App ID → Capabilities).
const withAppleSignIn = (config: ExpoConfig): ExpoConfig =>
  withEntitlementsPlist(config, (c) => {
    c.modResults["com.apple.developer.applesignin"] = ["Default"];
    return c;
  });

// ─── Exported config ─────────────────────────────────────────────────────────
// app.json provides the base; this file extends ios/android and APPENDS to
// plugins so app.json plugins (expo-router, expo-secure-store) are preserved.
// withAppleSignIn wraps the final config to set the iOS entitlement.

export default ({ config }: ConfigContext): ExpoConfig =>
  withAppleSignIn({
    ...config,
    // name and slug are required on ExpoConfig but typed as optional on ConfigContext.
    // The values below come from app.json; the fallbacks are only for TypeScript's sake.
    name: config.name ?? "STORIX",
    slug: config.slug ?? "STORIX-FE-2.1",

    ios: {
      ...config.ios,
      bundleIdentifier: iosBundleId,
      supportsTablet: true,
      googleServicesFile: iosGoogleServicesPlist,
      // Push Notifications + Background Modes (remote-notification) are
      // required for APNs delivery. The Firebase config plugin adds the
      // aps-environment entitlement automatically during prebuild.
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        UIBackgroundModes: Array.from(
          new Set([
            ...(((config.ios?.infoPlist as any)?.UIBackgroundModes as
              | string[]
              | undefined) ?? []),
            "remote-notification",
          ]),
        ),
      },
    },

    android: {
      ...config.android,
      package: androidPackage,
      googleServicesFile: androidGoogleServicesFile,
      // Android 13+ runtime permission for showing notifications.
      // FCM SDK declares the rest of the messaging-related permissions.
      permissions: Array.from(
        new Set([
          ...(config.android?.permissions ?? []),
          "android.permission.POST_NOTIFICATIONS",
        ]),
      ),
    },

    plugins: [
      // Preserve plugins declared in app.json (expo-router, expo-secure-store).
      ...(config.plugins ?? []),
      // React Native Firebase. The @react-native-firebase/app plugin wires
      // google-services.json / GoogleService-Info.plist into the native
      // builds and registers the modular SDK initialiser at app launch.
      // @react-native-firebase/messaging adds APNs entitlements / Android
      // notification permission and registers the FCM module.
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-image-picker",
        {
          photosPermission:
            "STORIX에서 피드 이미지를 첨부하려면 사진 접근 권한이 필요합니다.",
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      [
        "@react-native-seoul/kakao-login",
        {
          kakaoAppKey,
          overrideKakaoSDKVersion: "2.20.1",
          kotlinVersion: "2.1.20",
        },
      ],
      [
        "@react-native-seoul/naver-login",
        {
          urlScheme: naverUrlScheme,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: [
              "https://devrepo.kakao.com/nexus/content/groups/public/",
            ],
          },
        },
      ],
    ],
  });
