# Push Notifications — Local Setup (PUSH-1)

Phase: **PUSH-1-FCM-PERMISSION-DEVICE-TOKEN** — permission + FCM token only.
Backend delivery, deep-linking, and notification-centre UI are tracked in
later PUSH-* phases.

This document covers the **local engineering setup** that is required before
the new push code in `src/features/notification/*` will produce a usable FCM
token. The Firebase console steps themselves are owned by the
`storixbiz@gmail.com` account holder — the Android side is captured in Notion;
the iOS side needs a sibling Notion page.

---

## 1. Packages

Installed in this phase:

- `@react-native-firebase/app`
- `@react-native-firebase/messaging`

Both are configured via Expo config plugins in `app.config.ts` and are picked
up the next time `expo prebuild` runs.

## 2. Environment variables

Optional overrides — defaults are sensible for a local checkout:

| Var                          | Default                                       | Purpose                            |
| ---------------------------- | --------------------------------------------- | ---------------------------------- |
| `EXPO_IOS_BUNDLE_ID`         | `kr.storix.app`                               | iOS bundle identifier              |
| `EXPO_ANDROID_PACKAGE`       | `kr.storix.app`                               | Android applicationId              |
| `GOOGLE_SERVICES_JSON`       | `./android/app/google-services.json`          | Android Firebase client config     |
| `GOOGLE_SERVICE_INFO_PLIST`  | `./ios/STORIXFE21/GoogleService-Info.plist`   | iOS Firebase client config         |

> The two `GOOGLE_SERVICE*` files are normal Firebase client config — they may
> live in the repo subject to team policy. **Never** commit a Firebase Admin
> SDK service-account JSON or an APNs `.p8` private key; those belong on the
> backend only.

## 3. Android setup

1. Firebase Console → STORIX project → **Add app → Android**.
2. Package name: `kr.storix.app` (must match `EXPO_ANDROID_PACKAGE`).
3. Download `google-services.json`.
4. Place it at `android/app/google-services.json`.
5. Run:
   ```bash
   npm run prebuild:android
   npx expo run:android   # or `npm run android`
   ```
   The `@react-native-firebase/app` config plugin installs the
   `com.google.gms.google-services` Gradle plugin during prebuild.
6. The `android.permission.POST_NOTIFICATIONS` permission is added through
   `app.config.ts → android.permissions`; verify it appears in the generated
   `android/app/src/main/AndroidManifest.xml`.

Notion reference: see existing Android Firebase setup page (storixbiz@gmail.com).

## 4. iOS setup

1. Firebase Console → STORIX project → **Add app → iOS**.
2. Bundle ID: `kr.storix.app` (must match `EXPO_IOS_BUNDLE_ID`).
3. Download `GoogleService-Info.plist`.
4. Place it at `ios/STORIXFE21/GoogleService-Info.plist` (already linked in
   the Xcode project — overwrite the placeholder).
5. **Apple Developer portal** → App ID → enable **Push Notifications**.
6. **Apple Developer portal** → Keys → create an APNs Auth Key (`.p8`),
   download once, then in Firebase Console → Project Settings → Cloud
   Messaging → Apple app config → upload the `.p8` along with Team ID and
   Key ID. _Do not commit the `.p8` to the repo._
7. Push capability + entitlements:
   - `ios/STORIXFE21/STORIXFE21.entitlements` already declares
     `aps-environment = development` (PUSH-1). Production builds will need a
     separate provisioning profile / release entitlement set to `production`.
   - `ios/STORIXFE21/Info.plist` declares
     `UIBackgroundModes = ["remote-notification"]`.
   - `ios/STORIXFE21/AppDelegate.swift` calls `FirebaseApp.configure()`
     idempotently at launch.
8. Run:
   ```bash
   cd ios && pod install && cd -
   open ios/STORIXFE21.xcworkspace
   # then build/run on a real iPhone — APNs is not delivered to the simulator.
   ```

Notion reference: **create a new iOS Firebase setup page** that mirrors the
Android one. (Owned by: notification feature lead.)

## 5. JS-side runtime behaviour

Implemented under `src/features/notification/`:

- `services/pushPermission.ts` — `requestPushPermission()`
  - iOS: `messaging().requestPermission()`, `AUTHORIZED|PROVISIONAL` ⇒ allowed.
  - Android 13+: `PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS`.
  - Android <13: treated as granted.
  - Never throws — failures map to `denied`.
- `services/fcmToken.ts` — `getFcmDeviceToken()` and
  `subscribeFcmTokenRefresh()`
  - Calls `registerDeviceForRemoteMessages` first on iOS to avoid the
    `apns-token-not-set` race; retries once after `1.5s`.
- `api/notification.api.ts` — `registerDeviceToken(payload)`
  - **Endpoint not yet implemented.** While `ENDPOINT_AVAILABLE = false` the
    function logs the token in `__DEV__` and returns a synthetic success.
    Flip the flag (and confirm the path) once PUSH-2-BE lands.
- `hooks/useRegisterDeviceToken.ts` — React Query mutation wrapper.
- `hooks/usePushNotificationBootstrap.ts` — orchestrates everything; mounted
  from `app/_layout.tsx` as `<PushNotificationBootstrap />` inside the
  `QueryClientProvider`. Internal module-level guard prevents re-running the
  permission flow on re-renders.

The bootstrap **only runs when `useAuthStore.isAuthenticated === true`**, so
no permission prompt appears on the login screen.

## 6. Manual QA checklist

- [ ] Fresh install, log in → OS permission prompt appears (iOS) / Android-13
      prompt appears.
- [ ] Grant permission → console shows `[push] (dev) FCM token (full): …`.
- [ ] Copy the token into Firebase Console → Cloud Messaging → Send test
      message → message arrives (foreground log on iOS+Android).
- [ ] Deny permission → no crash, app remains usable, log shows
      `[push] permission not granted`.
- [ ] Background the app, send a test push → notification appears in tray
      (no JS hook required for system display).
- [ ] Kill & relaunch the app while logged in → no second permission prompt
      (the module-level guard keeps it once per session).
- [ ] Log out → log back in → flow re-runs once (module guard is per-process,
      not per-account).

## 7. Known follow-ups

- **PUSH-1-BG-HANDLER** — register
  `setBackgroundMessageHandler` at module entry (cannot live inside a React
  effect).
- **PUSH-2-BE** — replace the `ENDPOINT_AVAILABLE = false` short-circuit with
  the real backend path and platform-casing.
- **PUSH-3-SETTINGS** — manual retry / permission re-request from a settings
  screen for users who initially declined.
- **PUSH-4-UI** — notification-centre screen and deep-link routing.
