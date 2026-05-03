// app.config.ts — Dynamic Expo configuration.
// Reads environment variables at build time so secrets are never committed.
// Run `npx expo prebuild` after filling in .env (see .env.example).

import type { ConfigContext, ExpoConfig } from "expo/config";
import { withEntitlementsPlist } from "@expo/config-plugins";

// ─── Build-time env var helpers ───────────────────────────────────────────────
// Variables with EXPO_PUBLIC_ prefix are also inlined into the JS bundle.
// Variables without that prefix (EXPO_IOS_BUNDLE_ID etc.) are build-time only.

const kakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? "";
// Naver URL scheme must match the "scheme" field in app.json and the URL type
// registered in the Naver developer console.
const naverUrlScheme = process.env.EXPO_PUBLIC_NAVER_URL_SCHEME ?? "storixfe21";
const iosBundleId = process.env.EXPO_IOS_BUNDLE_ID ?? "kr.storix.app";
const androidPackage = process.env.EXPO_ANDROID_PACKAGE ?? "kr.storix.app";

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
// app.json provides the base; this file overrides ios/android/plugins.
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
    },

    android: {
      ...config.android,
      package: androidPackage,
    },

    plugins: [
      [
        "@react-native-seoul/kakao-login",
        {
          kakaoAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
          overrideKakaoSDKVersion: "2.20.1",
          kotlinVersion: "2.1.20",
        },
      ],
      [
        "@react-native-seoul/naver-login",
        {
          urlScheme: process.env.EXPO_PUBLIC_NAVER_URL_SCHEME,
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
