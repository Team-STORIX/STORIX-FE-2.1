# STORIX-FE-2.1 Migration Notes

Source: `Team-STORIX/STORIX-FE-2.0` · branch `develop` · app root `storix-fe/`
Target: `Team-STORIX/STORIX-FE-2.1` · branch `chore/2.1/SPRINT-1-migration`

---

## Phase 1 — Analysis (done)

Full migration map produced. See conversation history for the complete breakdown of reusable vs. rewrite-required files.

---

## Phase 2 — Base scaffold (done)

### Packages added

| Package | Version | Why |
|---|---|---|
| `zod` | latest | Used by every `*.schema.ts` file in 2.0; absent from 2.1 |
| `@stomp/stompjs` | ^7 | TopicRoom WebSocket/STOMP chat |
| `text-encoding` | ^0.7 | Hermes lacks `TextEncoder`; required by `@stomp/stompjs` at runtime |

### Folder structure created

```
src/
  lib/
    api/           ← API functions + schemas (migrated per-domain in Phase 3)
    auth/
      social/      ← platform.ts / native.ts / types.ts (Phase 3)
    utils/         ← formatTimeAgo.ts, jwt.ts (Phase 3)
  store/           ← Zustand stores (Phase 3 — storage layer rewrite first)
  hooks/
    auth/
    topicroom/
    works/
    search/
    library/
    feed/
    homeFeed/
    preference/
    favorite/
  components/
    common/
    topicroom/
    feed/
    library/
    home/
  theme/           ← design tokens, colors (new in 2.1)
  types/           ← shared TypeScript types (new in 2.1)

app/
  (auth)/          ← login, agreement, onboarding screens
  (tabs)/          ← existing Expo boilerplate tabs (to be replaced in Phase 4+)
  topicroom/       ← [roomId].tsx deep-link screen
```

---

## What must NOT be migrated directly

| Category | Reason |
|---|---|
| `src/app/**/*.tsx` (all Next.js pages) | Next.js App Router, not Expo Router |
| `src/components/**/*.tsx` (all 2.0 UI) | `div`/CSS/Tailwind — no React Native primitives |
| `src/styles/globals.css` | Web CSS, no RN equivalent |
| `src/app/fonts/SUIT-Variable.css` | Web font loader |
| `src/components/common/GAListener.tsx` | Google Analytics — browser-only |
| `src/lib/ga.ts` | Google Analytics — browser-only |
| `src/hooks/useInfiniteScroll.ts` | Uses `IntersectionObserver` — must rewrite with FlatList `onEndReached` |
| `src/lib/auth/social/web.ts` | `window.location` redirect — not valid in RN |
| `src/lib/auth/social/platform.ts` | Uses `@capacitor/core` — rewrite with `Platform.OS` |
| `src/lib/auth/social/native.ts` | Uses Capacitor plugins — rewrite with RN-native SDKs |
| `src/app/pending/PendingClient.tsx` | OAuth redirect callback page — web-only flow |

---

## Env vars

All `NEXT_PUBLIC_*` keys in `.env` must be renamed to `EXPO_PUBLIC_*` before any API call will work.

---

## Phase 3 — Storage + API client (next)

Prerequisite: **confirm with backend** whether the native login endpoints
(`/oauth/kakao-native/login`, `/oauth/naver-native/login`) and the refresh
endpoint (`/auth/tokens/refresh`) return `refreshToken` in the response body
(not only as an HTTP-only cookie). This decision controls the entire
`axios-instance.ts` rewrite strategy.

Steps once confirmed:

1. **`src/lib/api/axios-instance.ts`** — rewrite:
   - Remove `withCredentials`
   - Replace `window.location.href` with expo-router singleton
   - `NEXT_PUBLIC_API_URL` → `EXPO_PUBLIC_API_URL`
   - Token refresh using `expo-secure-store` instead of cookies

2. **Zustand stores** — swap storage layer:
   - `auth.store.ts`: `sessionStorage` → `expo-secure-store`
   - `profile.store.ts`: `sessionStorage` → `AsyncStorage`
   - `likes.store.ts` / `favorites.store.ts`: remove `'use client'`; add `AsyncStorage`

3. **`app/_layout.tsx`** — add `QueryClientProvider` + `text-encoding` polyfill bootstrap

4. Copy all `*.schema.ts` files from 2.0 (pure Zod, zero changes needed)

5. Copy all `*.api.ts` files from 2.0 with only env-var and `withCredentials` changes

---

## Phase 4 — Auth foundation (done)

Completed sub-phases:
- 4A-1: Auth API layer (`src/lib/api/auth/`)
- 4B:   Auth hooks (`src/hooks/auth/`)
- 4C:   Typed route casts cleaned up (after `expo start` regenerated router.d.ts)
- 4D:   Minimal auth screens + auth routing wired end-to-end
- 4F-1: Native social SDK packages installed (see below)

### Phase 4F-1 — Native social SDK packages (done)

**Kakao SDK choice:** `@react-native-seoul/kakao-login` (not `@react-native-kakao/core + user`).
Reason: single-package API, same maintainer as the Naver package, Expo config plugin included.

| Package | Version | Role |
|---|---|---|
| `@react-native-seoul/kakao-login` | `^5.4.2` | Kakao OAuth (iOS + Android) |
| `@react-native-seoul/naver-login` | `^4.2.4` | Naver OAuth (iOS + Android) |
| `@invertase/react-native-apple-authentication` | `^2.5.1` | Apple Sign In (iOS only; Android uses web flow) |

### ⚠️ Expo Go is NOT supported

All three packages contain **native code** and will crash in Expo Go.
A **Development Build** is required:
1. Add the plugins to `app.json` (see `src/lib/auth/social/native.ts` for config)
2. Run `npx expo prebuild` to generate `ios/` and `android/` directories
3. Run `npx expo run:ios` or `npx expo run:android` to build the custom dev client

### app.json plugins required (not yet added — need real keys)

```jsonc
"plugins": [
  "expo-router",
  "expo-secure-store",
  ["@react-native-seoul/kakao-login", { "kakaoAppKey": "<KAKAO_NATIVE_APP_KEY>" }],
  ["@react-native-seoul/naver-login", { "urlScheme": "storixfe21" }],
  "@invertase/react-native-apple-authentication"
]
```

### New Architecture compatibility note

`app.json` has `"newArchEnabled": true` (React Native New Architecture / TurboModules).
`@react-native-seoul/kakao-login` and `@react-native-seoul/naver-login` v5/v4 use the legacy bridge.
RN 0.81 includes a backwards-compatible interop layer so they **will work**, but monitor for
deprecation warnings after `expo prebuild`. If issues arise, consider disabling New Architecture
for these modules or waiting for upstream New Architecture support.

---

## Phase 4F-2 — Implement native.ts (next)

Replace the three throwing stubs in `src/lib/auth/social/native.ts` with real SDK calls.
API signatures are documented in that file. Prerequisites: app.json plugins added + prebuild run.

---

## Phase 5+ — Screen implementation (planned)

Implement Expo Router screens in `app/` using React Native primitives.
Port data-fetching hooks from 2.0 (replace `next/navigation` → `expo-router`).
Do NOT copy JSX from 2.0 — rebuild all UI from scratch with RN components.
