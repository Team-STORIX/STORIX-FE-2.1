// app.config.ts — Dynamic Expo configuration.
// Reads environment variables at build time so secrets are never committed.
// Run `npx expo prebuild` after filling in .env (see .env.example).

// Load .env eagerly so EXPO_PUBLIC_* vars are populated before requireEnv()
// runs below. Expo CLI also loads .env, but its loader executes AFTER config
// evaluation in some commands, which would defeat our build-time guards.
// `override: false` keeps real environment variables (CI, shell exports)
// taking precedence over .env values.
require("dotenv").config({ path: ".env.local", override: false });
require("dotenv").config({ override: false });

const { getKoreaBuildDate } = require("./scripts/build-date");

import fs from "fs";
import path from "path";
import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
  withEntitlementsPlist,
} from "@expo/config-plugins";
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
const androidPackage = process.env.EXPO_ANDROID_PACKAGE ?? "kr.storix.android";

// Firebase client config files. Both paths are optional at config evaluation
// time so the JS bundle can build without them — but native builds (prebuild)
// will fail loudly if Firebase is enabled and the file is missing. See
// PUSH_NOTIFICATION_SETUP.md for placement instructions.
const androidGoogleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";
const iosGoogleServicesPlist =
  process.env.GOOGLE_SERVICE_INFO_PLIST ??
  "./ios/STORIXFE21/GoogleService-Info.plist";
const iosApsEnvironment =
  process.env.EXPO_IOS_APS_ENVIRONMENT === "production"
    ? "production"
    : "development";
const androidNotificationIconSource = path.join(
  __dirname,
  "assets",
  "notification",
  "logo-statusbar.png",
);
const androidNotificationIconName = "ic_notification";
const androidNotificationChannelId = "storix_default_high";

// ─── iOS entitlement plugin ──────────────────────────────────────────────────
// @invertase/react-native-apple-authentication ships no Expo config plugin.
// Applied as a config wrapper (not in the plugins array) because the ExpoConfig
// type only permits string/tuple entries there — functions must wrap the config.
// Also requires "Sign In with Apple" to be enabled for the bundle ID in the
// Apple Developer portal (App ID → Capabilities).
const withIosEntitlements = (config: ExpoConfig): ExpoConfig =>
  withEntitlementsPlist(config, (c) => {
    c.modResults["com.apple.developer.applesignin"] = ["Default"];
    c.modResults["aps-environment"] = iosApsEnvironment;
    c.modResults["com.apple.developer.usernotifications.communication"] = true;
    return c;
  });

const withAndroidNotificationIcon: ConfigPlugin = (config) => {
  config = withDangerousMod(config, [
    "android",
    async (c) => {
      const drawableDir = path.join(
        c.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "drawable",
      );
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.copyFileSync(
        androidNotificationIconSource,
        path.join(drawableDir, `${androidNotificationIconName}.png`),
      );

      const stringsPath = path.join(
        c.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "values",
        "strings.xml",
      );
      if (fs.existsSync(stringsPath)) {
        const stringName = "default_notification_channel_id";
        const strings = fs.readFileSync(stringsPath, "utf8");
        if (!strings.includes(`name="${stringName}"`)) {
          fs.writeFileSync(
            stringsPath,
            strings.replace(
              "</resources>",
              `  <string name="${stringName}" translatable="false">${androidNotificationChannelId}</string>\n</resources>`,
            ),
          );
        }
      }

      return c;
    },
  ]);

  return withAndroidManifest(config, (c) => {
    c.modResults.manifest.$ = c.modResults.manifest.$ ?? {};
    c.modResults.manifest.$["xmlns:tools"] =
      c.modResults.manifest.$["xmlns:tools"] ??
      "http://schemas.android.com/tools";

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
    const metaData = app["meta-data"] ?? [];
    const upsertMetaData = (
      name: string,
      valueKey: "android:resource" | "android:value",
      value: string,
      replaceValueKey?: "android:resource" | "android:value",
    ) => {
      const existing = metaData.find(
        (item) => item.$?.["android:name"] === name,
      );

      if (existing) {
        const attrs = existing.$ as Record<string, string>;
        attrs[valueKey] = value;
        if (replaceValueKey) {
          attrs["tools:replace"] = replaceValueKey;
        }
        return;
      }

      metaData.push({
        $: {
          "android:name": name,
          [valueKey]: value,
          ...(replaceValueKey ? { "tools:replace": replaceValueKey } : {}),
        },
      });
    };

    upsertMetaData(
      "com.google.firebase.messaging.default_notification_icon",
      "android:resource",
      `@drawable/${androidNotificationIconName}`,
    );
    upsertMetaData(
      "com.google.firebase.messaging.default_notification_channel_id",
      "android:value",
      "@string/default_notification_channel_id",
      "android:value",
    );

    app["meta-data"] = metaData;
    return c;
  });
};

// ─── Exported config ─────────────────────────────────────────────────────────
// app.json provides the base; this file extends ios/android and APPENDS to
// plugins so app.json plugins (expo-router, expo-secure-store) are preserved.
// withIosEntitlements wraps the final config to set iOS capabilities that must
// be present in the generated native project.

export default ({ config }: ConfigContext): ExpoConfig =>
  withAndroidNotificationIcon(withIosEntitlements({
    ...config,
    // name and slug are required on ExpoConfig but typed as optional on ConfigContext.
    // The values below come from app.json; the fallbacks are only for TypeScript's sake.
    name: config.name ?? "STORIX",
    slug: config.slug ?? "STORIX-FE-2.1",

    ios: {
      ...config.ios,
      bundleIdentifier: iosBundleId,
      supportsTablet: false,
      googleServicesFile: iosGoogleServicesPlist,
      // Push Notifications + Background Modes (remote-notification) are
      // required for APNs delivery. aps-environment is set explicitly in
      // withIosEntitlements above so the generated entitlements cannot miss it.
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
        NSUserActivityTypes: Array.from(
          new Set([
            ...(((config.ios?.infoPlist as any)?.NSUserActivityTypes as
              | string[]
              | undefined) ?? []),
            "INSendMessageIntent",
          ]),
        ),
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
      blockedPermissions: Array.from(
        new Set([
          ...(config.android?.blockedPermissions ?? []),
          "android.permission.READ_MEDIA_VIDEO",
        ]),
      ),
      // Android 13+ runtime permission for showing notifications.
      // FCM SDK declares the rest of the messaging-related permissions.
      permissions: Array.from(
        new Set([
          ...(config.android?.permissions ?? []),
          "android.permission.POST_NOTIFICATIONS",
        ]),
      ),
    },

    notification: {
      ...config.notification,
      icon: "./assets/notification/logo-statusbar.png",
      color: "#FF4093",
      androidMode: "default",
      androidCollapsedTitle: "STORIX",
    },

    extra: {
      ...(config.extra ?? {}),
      // Evaluated during every native build/prebuild, independent of the
      // machine or CI server timezone.
      versionDate: getKoreaBuildDate(),
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
      "@portone/react-native-sdk/plugin",
      "./plugins/withNotificationServiceExtension",
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
        "expo-media-library",
        {
          photosPermission:
            "STORIX에서 카드 이미지를 저장하려면 사진 접근 권한이 필요합니다.",
          savePhotosPermission:
            "STORIX에서 프로필카드와 리뷰카드를 사진 앱에 저장하려면 권한이 필요합니다.",
          isAccessMediaLocationEnabled: false,
        },
      ],
      [
        "react-native-share",
        {
          ios: ["twitter"],
          android: ["com.twitter.android"],
        },
      ],
      [
        "@react-native-seoul/kakao-login",
        {
          kakaoAppKey,
          overrideKakaoSDKVersion: "2.20.0",
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
  }));
